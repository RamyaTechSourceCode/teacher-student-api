/**
 * Base class for errors that map to a specific HTTP status and a message
 * that is safe to return to the client.
 */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(404, message);
  }
}

export class UnsupportedMediaTypeError extends AppError {
  constructor(message = "Content-Type must be 'application/json'") {
    super(415, message);
  }
}
