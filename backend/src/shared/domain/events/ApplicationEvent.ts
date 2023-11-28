/**
 * The base class for emit events. Every event emitted should extend this class.
 */
export class ApplicationEvent<T> {
  public readonly createdAt: Date = new Date();

  constructor(readonly name: string, readonly payload: T) {}
}
