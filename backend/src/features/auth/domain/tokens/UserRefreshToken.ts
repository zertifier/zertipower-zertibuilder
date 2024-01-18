import { Token } from "./Token";
import { User } from "../../../users/domain/User";
import * as moment from "moment";
import { TokenTypes } from "./TokenType";
import * as Joi from "joi";
import { InvalidArgumentError } from "../../../../shared/domain/error/common";
import { RegexUtils } from "../../../../shared/domain/utils";

const jwtSchema = Joi.object({
  exp: Joi.date().required(),
  id: Joi.number().required(),
  role: Joi.string().required(),
  username: Joi.string().required(),
  firstname: Joi.string().required(),
  email: Joi.string().required(),
  type: Joi.string().required().allow(TokenTypes.REFRESH),
  wallet_address: Joi.string().regex(RegexUtils.ETHEREUM_WALLET_ADDRESS),
  iat: Joi.date().required(),
});

/**
 * The implementation of Token for user refresh tokens
 */
export class UserRefreshToken extends Token {
  type: TokenTypes;
  expirationTime: Date;

  constructor(public readonly user: User) {
    super();
    if (!user.id) {
      throw new InvalidArgumentError("User id must be defined");
    }
    this.type = TokenTypes.REFRESH;
    this.expirationTime = moment().add(6, "hours").toDate();
  }

  public static fromValues(payload: any): UserRefreshToken {
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
      role: payload.role,
      walletAddress: payload.wallet_address,
    })
      .withId(payload.id)
      .withUserRole(payload.role);
    return new UserRefreshToken(user);
  }

  serialize(): object {
    const { id, role, email, username, firstname } = this.user.serialize();
    return {
      id,
      role: role.name,
      email,
      username,
      firstname,
      type: this.type,
    };
  }
}
