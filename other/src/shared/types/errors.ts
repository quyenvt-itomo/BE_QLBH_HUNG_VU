export class AppError extends Error {
  public statusCode: number;
  public success: boolean = false;
  public isOperational: boolean;
  public errors?: IError[];

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    errors?: IError[],
  ) {
    super(message);
    this.message = message; // Explicitly set the message property
    this.statusCode = statusCode;
    this.success = false;
    this.isOperational = isOperational;
    this.errors = errors;
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export interface IError {
  field: string;
  code: string;
}

export class ValidationError extends AppError {
  constructor(
    message: string = "Validation failed",
    errors?: IError[] | IError,
  ) {
    super(
      message,
      400,
      true,
      Array.isArray(errors) ? errors : errors ? [errors] : undefined,
    );
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, errors?: IError[] | IError) {
    super(
      message,
      404,
      true,
      Array.isArray(errors) ? errors : errors ? [errors] : undefined,
    );
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized", errors?: IError[] | IError) {
    super(
      message,
      401,
      true,
      Array.isArray(errors) ? errors : errors ? [errors] : undefined,
    );
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Forbidden", errors?: IError[] | IError) {
    super(
      message,
      403,
      true,
      Array.isArray(errors) ? errors : errors ? [errors] : undefined,
    );
  }
}

export class DuplicateError extends AppError {
  constructor(message: string = "Duplicate", errors?: IError[] | IError) {
    super(
      message,
      409,
      true,
      Array.isArray(errors) ? errors : errors ? [errors] : undefined,
    );
  }
}

export class ConflictError extends AppError {
  constructor(message: string = "Conflict", errors?: IError[] | IError) {
    super(
      message,
      409,
      true,
      Array.isArray(errors) ? errors : errors ? [errors] : undefined,
    );
  }
}

export class InternalServerError extends AppError {
  constructor(
    message: string = "Internal Server Error",
    errors?: IError[] | IError,
  ) {
    super(
      message,
      500,
      false,
      Array.isArray(errors) ? errors : errors ? [errors] : undefined,
    );
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(
    message: string = "Service Unavailable",
    errors?: IError[] | IError,
  ) {
    super(
      message,
      503,
      false,
      Array.isArray(errors) ? errors : errors ? [errors] : undefined,
    );
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = "Bad Request", errors?: IError[] | IError) {
    super(
      message,
      400,
      true,
      Array.isArray(errors) ? errors : errors ? [errors] : undefined,
    );
  }
}

// not permission
export class NotPermissionError extends AppError {
  constructor(message: string = "Not Permission", errors?: IError[] | IError) {
    super(
      message,
      403,
      true,
      Array.isArray(errors) ? errors : errors ? [errors] : undefined,
    );
  }
}
