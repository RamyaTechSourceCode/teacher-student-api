/**
 * Errors that map to a specific HTTP status and a message
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
