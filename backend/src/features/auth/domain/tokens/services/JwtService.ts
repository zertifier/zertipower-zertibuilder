import { Token } from "../Token";

/**
 * Defines the methods that an implementation of a JWT service should have to sign,
 * decode and verify JWT
 */
export abstract class JwtService {
  /**
   * Sign payload and set expiration as expiration time the provided timestamp
   * @param payload
   */
  abstract sign(payload: Token): Promise<string>;

  /**
   * Ensures that token is valid. Verifies signature and date and returns their payload
   * @param jwt
   */
  abstract verify(jwt: string): Promise<any>;

  /**
   * Decode a token and return their payload
   * @param jwt
   */
  abstract decode(jwt: string): Promise<any>;
}
