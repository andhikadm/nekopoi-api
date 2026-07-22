export class NekopoiError extends Error {
  readonly path?: string;
  readonly statusCode?: number;

  constructor(
    message: string,
    options?: { cause?: unknown; path?: string; statusCode?: number }
  ) {
    super(message, options?.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = 'NekopoiError';
    this.path = options?.path;
    this.statusCode = options?.statusCode;
  }
}

export class NekopoiValidationError extends NekopoiError {
  constructor(message: string) {
    super(message);
    this.name = 'NekopoiValidationError';
  }
}

export class NekopoiScrapeError extends NekopoiError {
  constructor(
    message: string,
    options?: { cause?: unknown; path?: string; statusCode?: number }
  ) {
    super(message, options);
    this.name = 'NekopoiScrapeError';
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

export function getAxiosStatus(error: unknown): number | undefined {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as { response?: { status?: number } }).response?.status === 'number'
  ) {
    return (error as { response: { status: number } }).response.status;
  }
  return undefined;
}
