import { Criteria } from "../../../../../shared/domain/criteria/Criteria";
import { User } from "../../../../users/domain/User";

/**
 * This repository is responsible to manage refresh tokens
 */
export abstract class AuthTokenRepository {
  /**
   * Save refresh token saving which user is their proprietary and when expires
   * @param jwt
   * @param user
   * @param expirationTime
   */
  abstract save(jwt: string, user: User, expirationTime: Date): Promise<void>;

  abstract delete(criteria: Criteria): Promise<void>;

  abstract find(criteria: Criteria): Promise<Array<string>>;
}
