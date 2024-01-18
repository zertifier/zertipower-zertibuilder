import { Token } from "./Token";
import { User } from "../../../users/domain/User";
import * as moment from "moment";
import { TokenTypes } from "./TokenType";
import * as Joi from "joi";
import { InvalidArgumentError } from "../../../../shared/domain/error/common";
import { RegexUtils } from "../../../../shared/domain/utils";
import { UserRole } from "../../../roles/domain/UserRole";

const jwtSchema = Joi.object({
  exp: Joi.date().required(),
  id: Joi.number().required(),
  role: Joi.string().required(),
  username: Joi.string().required(),
  firstname: Joi.string().required(),
  email: Joi.string().required(),
  type: Joi.string().required().allow(TokenTypes.ACCESS),
  wallet_address: Joi.string().regex(RegexUtils.ETHEREUM_WALLET_ADDRESS),
  iat: Joi.date().required(),
});

/**
 * The implementation of Token for user access tokens
 */
export class UserAccessToken extends Token {
  expirationTime: Date;
  type: TokenTypes;

  constructor(public readonly user: User) {
    super();

    this.type = TokenTypes.ACCESS;

    if (!this.user.id) {
      throw new InvalidArgumentError("User id must be defined");
    }
    this.expirationTime = moment().add(15, "minutes").toDate();
  }

  public static fromValues(payload: any): UserAccessToken {
    const result = jwtSchema.validate(payload);
    if (result.error) {
      throw new InvalidArgumentError(result.error.message);
    }

    const user = new User({
      email: payload.email,
      username: payload.username,
      firstname: payload.firstname,
      password: "",
      lastname: payload.lastname,
      walletAddress: payload.wallet_address,
      role: new UserRole({ name: payload.role }),
    }).withId(payload.id);
    return new UserAccessToken(user);
  }

  serialize(): object {
    const {
      id,
      email,
      username,
      firstname,
      userRole: role,
      walletAddress: wallet_address,
    } = this.user;
    return {
      id,
      role: role.name,
      email,
      username,
      firstname,
      wallet_address,
      type: this.type,
    };
  }
}
