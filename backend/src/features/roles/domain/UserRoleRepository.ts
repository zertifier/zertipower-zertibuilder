import { UserRole } from "./UserRole";
import { Criteria } from "../../../shared/domain/criteria/Criteria";

export abstract class UserRoleRepository {
  /**
   * Save provided roles to repository.
   * Create new roles and update existing roles.
   * If a role has an id tries to update a role matching this id.
   * @param roles
   */
  abstract save(...roles: Array<UserRole>): Promise<Array<UserRole>>;

  /**
   * Get roles by criteria
   * @param criteria
   */
  abstract find(criteria: Criteria): Promise<Array<UserRole>>;

  /**
   * Remove roles by criteria
   * @param criteria
   */
  abstract delete(criteria: Criteria): Promise<void>;
}
