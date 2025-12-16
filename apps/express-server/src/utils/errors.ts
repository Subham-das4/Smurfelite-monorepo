// ApiError.ts

class ApiError extends Error {
  public statusCode: number;

  //  Indicates if the error is operational (trusted) or a programming error
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);

    // Set custom properties
    this.statusCode = statusCode;
    this.isOperational = true; // Mark as an expected/handled error

    // This line is standard practice in TypeScript to correctly set the prototype chain
    Object.setPrototypeOf(this, ApiError.prototype);

    // Capturing the stack trace (important for debugging)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }
}

export default ApiError;
