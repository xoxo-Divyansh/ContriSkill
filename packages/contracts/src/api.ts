export type ApiMeta = {
  requestId: string;
  timestamp: string;
};

export type ApiSuccess<T> = {
  data: T;
  meta?: ApiMeta;
};

export type ApiError = {
  error: {
    code: string;
    message: string;
    details?: Record<string, string | number | boolean>;
  };
  meta?: ApiMeta;
};
