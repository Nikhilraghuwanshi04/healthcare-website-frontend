export type ServiceErrorCode =
  | 'not_found'
  | 'invalid_input'
  | 'slot_unavailable'
  | 'unauthorized'
  | 'conflict'
  | 'unknown';

/**
 * Every service throws this instead of a bare Error, so UI can branch on
 * `code` today and on a real HTTP status mapping later.
 */
export class ServiceError extends Error {
  readonly code: ServiceErrorCode;

  constructor(code: ServiceErrorCode, message: string) {
    super(message);
    this.name = 'ServiceError';
    this.code = code;
  }
}

export function isServiceError(error: unknown): error is ServiceError {
  return error instanceof ServiceError;
}

export function messageOf(error: unknown, fallback: string): string {
  if (isServiceError(error) || error instanceof Error) return error.message;
  return fallback;
}
