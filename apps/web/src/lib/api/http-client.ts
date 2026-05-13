import { normalizeApiError, normalizeTransportError } from "./error-normalizer";
import type {
  ApiClientConfig,
  ApiClientRequestOptions,
  ApiEnvelopeSuccess,
  HttpClient,
  HttpMethod
} from "./types";
import { ApiClientError } from "./types";

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const isSuccessEnvelope = <TData>(value: unknown): value is ApiEnvelopeSuccess<TData> => {
  return isRecord(value) && "data" in value;
};

const parseJsonResponse = async (response: Response): Promise<unknown> => {
  const text = await response.text();
  if (text.length === 0) {
    return undefined;
  }

  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
};

const shouldAttachJsonContentType = (body: unknown, headers: Headers): boolean => {
  if (body === undefined || body === null) {
    return false;
  }

  if (body instanceof FormData || body instanceof URLSearchParams || body instanceof Blob) {
    return false;
  }

  return !headers.has("content-type");
};

const buildBody = (body: unknown): BodyInit | undefined => {
  if (body === undefined || body === null) {
    return undefined;
  }

  if (
    typeof body === "string" ||
    body instanceof FormData ||
    body instanceof URLSearchParams ||
    body instanceof Blob
  ) {
    return body;
  }

  return JSON.stringify(body);
};

const joinUrl = (baseUrl: string, path: string): string => {
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  return new URL(normalizedPath, baseUrl).toString();
};

const withTimeoutSignal = (
  requestSignal: AbortSignal | undefined,
  timeoutMs: number
): {
  signal: AbortSignal;
  wasTimedOut: () => boolean;
  cleanup: () => void;
} => {
  const controller = new AbortController();
  let timedOut = false;

  const timeoutHandle = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  const onAbort = () => {
    controller.abort();
  };

  if (requestSignal) {
    if (requestSignal.aborted) {
      controller.abort();
    } else {
      requestSignal.addEventListener("abort", onAbort, { once: true });
    }
  }

  return {
    signal: controller.signal,
    wasTimedOut: () => timedOut,
    cleanup: () => {
      clearTimeout(timeoutHandle);
      if (requestSignal) {
        requestSignal.removeEventListener("abort", onAbort);
      }
    }
  };
};

export const createHttpClient = (config: ApiClientConfig): HttpClient => {
  const fetcher = config.fetcher ?? fetch;
  const defaultTimeoutMs = config.defaultTimeoutMs ?? 8000;

  const request = async <TData, TBody = unknown>(
    path: string,
    options: ApiClientRequestOptions<TBody> = {}
  ): Promise<TData> => {
    const method: HttpMethod = options.method ?? "GET";
    const headers = new Headers(config.defaultHeaders);
    const optionHeaders = new Headers(options.headers);
    optionHeaders.forEach((value, key) => headers.set(key, value));

    const requestBody = buildBody(options.body);
    if (shouldAttachJsonContentType(options.body, headers)) {
      headers.set("content-type", "application/json");
    }

    const timeout = options.timeoutMs ?? defaultTimeoutMs;
    const timeoutControl = withTimeoutSignal(options.signal, timeout);

    try {
      const response = await fetcher(joinUrl(config.baseUrl, path), {
        method,
        headers,
        body: requestBody ?? null,
        signal: timeoutControl.signal
      });

      const parsed = await parseJsonResponse(response);

      if (!response.ok) {
        throw normalizeApiError(response.status, parsed);
      }

      if (!isSuccessEnvelope<TData>(parsed)) {
        throw new ApiClientError({
          kind: "invalid_response",
          code: "INVALID_RESPONSE",
          status: response.status,
          message: "API returned a non-standard success payload."
        });
      }

      return parsed.data;
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }

      throw normalizeTransportError(error, timeoutControl.wasTimedOut());
    } finally {
      timeoutControl.cleanup();
    }
  };

  return {
    request,
    get: <TData>(path: string, options?: Omit<ApiClientRequestOptions, "method" | "body">) =>
      request<TData>(path, { ...options, method: "GET" }),
    post: <TData, TBody = unknown>(
      path: string,
      options?: Omit<ApiClientRequestOptions<TBody>, "method">
    ) => request<TData, TBody>(path, { ...options, method: "POST" }),
    patch: <TData, TBody = unknown>(
      path: string,
      options?: Omit<ApiClientRequestOptions<TBody>, "method">
    ) => request<TData, TBody>(path, { ...options, method: "PATCH" }),
    del: <TData>(path: string, options?: Omit<ApiClientRequestOptions, "method" | "body">) =>
      request<TData>(path, { ...options, method: "DELETE" })
  };
};
