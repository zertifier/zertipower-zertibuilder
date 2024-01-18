import { ErrorCode } from "./ErrorCode";

/**
 * The base class for errors. Every error that throws the application itself should
 * extend this class.
 */
export abstract class ApplicationError extends Error {
  metadata: any;
  public abstract readonly errorCode: ErrorCode;

  withMetadata(metadata: any): ApplicationError {
    this.metadata = metadata;
    return this;
  }
}
