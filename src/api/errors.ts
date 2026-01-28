export class ApiError extends Error {
  constructor(
    public readonly code: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }

  static authenticationRequired(): ApiError {
    return new ApiError(403, "Authentication required");
  }

  static notFound(): ApiError {
    return new ApiError(404, "Not found");
  }

  static other(code: number, message: string): ApiError {
    return new ApiError(code, message);
  }
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly cause?: ApiError | Error
  ) {
    super(message);
    this.name = "ApiClientError";
  }

  static canNotDecodeResponseJson(error?: Error): ApiClientError {
    return new ApiClientError("Cannot decode response JSON", error);
  }

  static apiError(error: ApiError): ApiClientError {
    return new ApiClientError(`API error: ${error.message}`, error);
  }

  static requestFailed(error?: Error): ApiClientError {
    return new ApiClientError("Request failed", error);
  }
}
