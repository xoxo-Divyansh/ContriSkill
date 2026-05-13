export const httpStatus = {
  ok: 200,
  badRequest: 400,
  unauthorized: 401,
  forbidden: 403,
  notFound: 404,
  conflict: 409,
  unprocessableEntity: 422,
  locked: 423,
  tooManyRequests: 429
} as const;

export type HttpStatusCode = (typeof httpStatus)[keyof typeof httpStatus];
