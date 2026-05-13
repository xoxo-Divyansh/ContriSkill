import type { ApiError, ApiErrorCode, ApiSuccess } from "@contriskill/contracts";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type ApiClientRequestOptions<TBody = unknown> = {
  method?: HttpMethod;
  body?: TBody;
  headers?: HeadersInit;
  signal?: AbortSignal;
  timeoutMs?: number;
};

export type ApiClientConfig = {
  baseUrl: string;
  defaultHeaders?: HeadersInit;
  defaultTimeoutMs?: number;
  fetcher?: typeof fetch;
};

export type ApiEnvelopeSuccess<TData> = ApiSuccess<TData>;

export type ApiEnvelopeError = ApiError;

export type ApiTransportErrorKind = "network" | "timeout" | "aborted";

export type ApiClientErrorKind = "api" | "transport" | "invalid_response";

export type ApiClientErrorCode =
  | ApiErrorCode
  | "UNKNOWN_API_ERROR"
  | "TRANSPORT_ERROR"
  | "INVALID_RESPONSE";

export type ApiClientErrorInput = {
  kind: ApiClientErrorKind;
  code: ApiClientErrorCode;
  message: string;
  status?: number;
  details?: Record<string, string | number | boolean>;
  transportErrorKind?: ApiTransportErrorKind;
  cause?: unknown;
};

export class ApiClientError extends Error {
  readonly kind: ApiClientErrorKind;
  readonly code: ApiClientErrorCode;
  readonly status: number | undefined;
  readonly details: Record<string, string | number | boolean> | undefined;
  readonly transportErrorKind: ApiTransportErrorKind | undefined;
  override readonly cause: unknown;

  constructor(input: ApiClientErrorInput) {
    super(input.message);
    this.name = "ApiClientError";
    this.kind = input.kind;
    this.code = input.code;
    this.status = input.status;
    this.details = input.details;
    this.transportErrorKind = input.transportErrorKind;
    this.cause = input.cause;
  }
}

export type HttpClient = {
  request<TData, TBody = unknown>(
    path: string,
    options?: ApiClientRequestOptions<TBody>
  ): Promise<TData>;
  get<TData>(
    path: string,
    options?: Omit<ApiClientRequestOptions, "method" | "body">
  ): Promise<TData>;
  post<TData, TBody = unknown>(
    path: string,
    options?: Omit<ApiClientRequestOptions<TBody>, "method">
  ): Promise<TData>;
  patch<TData, TBody = unknown>(
    path: string,
    options?: Omit<ApiClientRequestOptions<TBody>, "method">
  ): Promise<TData>;
  del<TData>(
    path: string,
    options?: Omit<ApiClientRequestOptions, "method" | "body">
  ): Promise<TData>;
};
