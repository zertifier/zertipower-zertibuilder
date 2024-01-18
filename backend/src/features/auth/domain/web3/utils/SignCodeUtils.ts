import { ethers } from "ethers";

export class SignCodeUtils {
  public static getRandomCode() {
    const randomBytes = ethers.randomBytes(20);
    return `${ethers.sha256(randomBytes)}${new Date().getTime()}`;
  }
}
