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
  message: string;
}

export class ValidationError extends AppError {
  constructor(
    message: string = "Validation failed",
    errors?: IError[] | string,
  ) {
    super(message, 400, true, convertToErrors(errors, message));
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, errors?: IError[] | string) {
    super(message, 404, true, convertToErrors(errors, message));
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized", errors?: IError[] | string) {
    super(message, 401, true, convertToErrors(errors, message));
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Forbidden", errors?: IError[] | string) {
    super(message, 403, true, convertToErrors(errors, message));
  }
}

export class DuplicateError extends AppError {
  constructor(message: string = "Duplicate", errors?: IError[] | string) {
    super(message, 409, true, convertToErrors(errors, message));
  }
}

export class ConflictError extends AppError {
  constructor(message: string = "Conflict", errors?: IError[] | string) {
    super(message, 409, true, convertToErrors(errors, message));
  }
}

export class InternalServerError extends AppError {
  constructor(
    message: string = "Internal Server Error",
    errors?: IError[] | string,
  ) {
    super(message, 500, false, convertToErrors(errors, message));
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(
    message: string = "Service Unavailable",
    errors?: IError[] | string,
  ) {
    super(message, 503, false, convertToErrors(errors, message));
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = "Bad Request", errors?: IError[] | string) {
    super(message, 400, true, convertToErrors(errors, message));
  }
}

// not permission
export class NotPermissionError extends AppError {
  constructor(message: string = "Not Permission", errors?: IError[] | string) {
    super(message, 403, true, convertToErrors(errors, message));
  }
}

export const convertToErrors = (
  errors?: IError[] | string,
  message: string = "",
): IError[] | undefined => {
  if (Array.isArray(errors)) {
    return errors;
  }

  if (typeof errors === "string") {
    return [
      {
        field: errors || "unknown",
        message,
      },
    ];
  }
};
