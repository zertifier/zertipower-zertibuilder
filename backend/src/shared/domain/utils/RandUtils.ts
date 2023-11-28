export class RandUtils {
  public static randomNumber(min: number, max: number) {
    const difference = max - min;
    let number = Math.random() * difference;
    number = number + min;
    number = Math.round(number);
    return number;
  }
}
