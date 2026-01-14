export class AppError extends Error {
  status: number;
  code: string;
  message: string;
  details?: any;

  constructor(code: string, message?: string, status = 400, details?: any) {
    super(message || code);
    this.code = code;
    this.message = message || code;
    this.status = status;
    this.details = details;
  }
}
