import * as bcrypt from "bcrypt";
import { RandUtils } from "../../../../shared/domain/utils";
import * as CryptoJS from 'crypto-js';

export class PasswordUtils {
  /**
   * Encrypt password
   * @param password
   */
  public static async encrypt(password: string): Promise<string> {
    return await bcrypt.hash(password, 14);
  }

  /**
   * Check if encrypted password and password are the same
   * @param hash
   * @param password
   */
  public static async match(hash: string, password: string): Promise<boolean> {
    let pwd = await bcrypt.hash(password, 14);
    console.log(pwd);
    return await bcrypt.compare(password, hash);
  }

  public static randomPassword(): string {
    const dictionary =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*(),.?";
    const PASSWORD_LENGTH = 12;
    const passwordCharacters: Array<string> = [];
    for (let i = 0; i < PASSWORD_LENGTH; i++) {
      const index = RandUtils.randomNumber(0, dictionary.length);
      passwordCharacters.push(dictionary[index]);
    }
    return passwordCharacters.join("");
  }

// Función para cifrar datos
public static encryptData(data: string, key: string): string {
  const encryptedData = CryptoJS.AES.encrypt(data, key).toString();
  return encryptedData;
}

// Función para descifrar datos
public static decryptData(encryptedData: string, key: string): string {
  const decryptedDataBytes = CryptoJS.AES.decrypt(encryptedData, key);
  const decryptedData = decryptedDataBytes.toString(CryptoJS.enc.Utf8);
  return decryptedData;
}

}
