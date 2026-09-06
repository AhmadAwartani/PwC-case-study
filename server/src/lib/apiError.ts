/**
 * Thrown anywhere in the request pipeline (controllers, services,
 * middleware) to produce a consistent { error: { code, message, details? } }
 * JSON response via the centralized error handler in middleware/errorHandler.ts.
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }

  static badRequest(message = "Invalid request data.", details?: unknown) {
    return new ApiError(400, "VALIDATION_ERROR", message, details);
  }

  static unauthorized(message = "Authentication is required.") {
    return new ApiError(401, "UNAUTHORIZED", message);
  }

  static forbidden(message = "You do not have permission to perform this action.") {
    return new ApiError(403, "FORBIDDEN", message);
  }

  static notFound(message = "Resource not found.") {
    return new ApiError(404, "NOT_FOUND", message);
  }

  static conflict(message = "This resource already exists.", details?: unknown) {
    return new ApiError(409, "CONFLICT", message, details);
  }

  static internal(message = "An unexpected error occurred.") {
    return new ApiError(500, "INTERNAL_ERROR", message);
  }
}
