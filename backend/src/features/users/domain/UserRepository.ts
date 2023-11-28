import { Criteria } from '../../../shared/domain/criteria/Criteria';
import { User } from './User';

export abstract class UserRepository {
  /**
   * Find users by specified criteria
   * @param criteria
   */
  abstract find(criteria: Criteria): Promise<Array<User>>;

  /**
   * Save provided user to repository
   * @param user
   */
  abstract save(user: User): Promise<User>;

  /**
   * Update provided user
   * @param user
   */
  abstract update(user: User): Promise<User>;

  /**
   * Remove user by specified criteria
   * @param criteria
   */
  abstract remove(criteria: Criteria): Promise<void>;
}
