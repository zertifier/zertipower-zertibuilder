import { Injectable } from "@nestjs/common";
import { Criteria } from "../../../../shared/domain/criteria/Criteria";
import { UserRepository } from "../../domain/UserRepository";

/**
 * Return users
 */
@Injectable()
export class FindUsersAction {
  constructor(private userRepository: UserRepository) {}

  async run(criteria: Criteria) {
    return this.userRepository.find(criteria);
  }
}
