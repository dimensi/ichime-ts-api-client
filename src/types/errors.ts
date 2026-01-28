export interface ApiError {
  code: number;
  message: string;
}

export interface ApiErrorResponse {
  error: ApiError;
}

export interface ApiSuccessResponse<T> {
  data: T;
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly code?: number,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "ApiClientError";
  }

  static fromApiError(error: ApiError): ApiClientError {
    return new ApiClientError(error.message, error.code);
  }

  static requestFailed(cause?: unknown): ApiClientError {
    return new ApiClientError("Request failed", undefined, cause);
  }

  static decodeFailed(cause?: unknown): ApiClientError {
    return new ApiClientError("Failed to decode response JSON", undefined, cause);
  }
}
