import { InvalidArgumentError } from "../error/common";

export class TypeUtils {
  public static parseBoolean(value: string) {
    if (value === "true") {
      return true;
    }
    if (value === "false") {
      return false;
    }

    throw new InvalidArgumentError("Value must be 'true' or 'false'");
  }

  public static toInteger(value: string): number {
    const parsedValue = parseInt(value);
    if (isNaN(parsedValue)) {
      throw new InvalidArgumentError("Value is not a valid integer");
    }

    return parsedValue;
  }

  public static toFloat(value: string): number {
    const parsedValue = parseFloat(value);
    if (isNaN(parsedValue)) {
      throw new InvalidArgumentError("Value is not a valid integer");
    }

    return parsedValue;
  }

  public static toDate(value: string): Date {
    let timestamp: number;
    try {
      timestamp = this.toInteger(value);
    } catch (err) {
      throw new InvalidArgumentError("Date must be a timestamp");
    }

    return new Date(timestamp);
  }

  public static toBool(value: string): boolean {
    if (value === "true") {
      return true;
    }
    if (value === "false") {
      return false;
    }

    throw new InvalidArgumentError("Provided value is not a valid boolean");
  }
}
