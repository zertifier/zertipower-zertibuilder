/**
 * An interface that defines a method to convert complex objects or classes to
 * plain javascript objects that are easier to stringify.
 */
export interface JsonSerializer {
  serialize(): any;
}
