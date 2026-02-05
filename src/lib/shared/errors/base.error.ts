/**
 * Base error class for application errors
 */
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error for user input issues
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('VALIDATION_ERROR', message, 400, details);
  }
}

/**
 * Authentication error
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super('AUTHENTICATION_ERROR', message, 401);
  }
}

/**
 * Authorization error
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super('AUTHORIZATION_ERROR', message, 403);
  }
}

/**
 * Not found error
 */
export class NotFoundError extends AppError {
  constructor(resource: string, id?: string | number) {
    super(
      'NOT_FOUND_ERROR',
      id ? `${resource} with id ${id} not found` : `${resource} not found`,
      404,
      { resource, id }
    );
  }
}

/**
 * Business logic error
 */
export class BusinessLogicError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('BUSINESS_LOGIC_ERROR', message, 422, details);
  }
}
