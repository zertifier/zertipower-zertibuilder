import * as bcrypt from 'bcrypt';
import { RandUtils } from '../../../../shared/domain/utils';

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
    return await bcrypt.compare(password, hash);
  }

  public static randomPassword(): string {
    const dictionary =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*(),.?';
    const PASSWORD_LENGTH = 12;
    const passwordCharacters: Array<string> = [];
    for (let i = 0; i < PASSWORD_LENGTH; i++) {
      const index = RandUtils.randomNumber(0, dictionary.length);
      passwordCharacters.push(dictionary[index]);
    }
    return passwordCharacters.join('');
  }
}
