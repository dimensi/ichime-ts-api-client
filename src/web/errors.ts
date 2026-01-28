export class WebClientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WebClientError";
  }

  static couldNotConvertResponseToHttpResponse(): WebClientError {
    return new WebClientError("Could not convert response to HTTP response");
  }

  static couldNotConvertResponseDataToString(): WebClientError {
    return new WebClientError("Could not convert response data to string");
  }

  static badStatusCode(statusCode: number): WebClientError {
    return new WebClientError(`Bad status code: ${statusCode}`);
  }

  static authenticationRequired(): WebClientError {
    return new WebClientError("Authentication required");
  }

  static couldNotParseHtml(): WebClientError {
    return new WebClientError("Could not parse HTML");
  }

  static unknownError(error: Error): WebClientError {
    const err = new WebClientError(`Unknown error: ${error.message}`);
    err.cause = error;
    return err;
  }
}

export class WebClientTypeNormalizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WebClientTypeNormalizationError";
  }

  static failedCreatingDTOFromHTMLElement(message: string): WebClientTypeNormalizationError {
    return new WebClientTypeNormalizationError(message);
  }
}
