import {
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  Injectable,
} from "@nestjs/common";
import {
  TokenExpiredError,
  TokenNotGivenError,
  TokenNotValidError,
} from "../../../domain/tokens/errors";
import { JwtService } from "../../../domain/tokens/services/JwtService";
import { UserAccessToken } from "../../../domain/tokens/UserAccessToken";
import { BadRequestError } from "../../../../../shared/domain/error/common";
import { TokenTypes } from "../../../domain/tokens/TokenType";
import { ByUserIdCriteria } from "../../../../users/domain/UserId/ByUserIdCriteria";
import { UserRepository } from "../../../../users/domain/UserRepository";

/**
 * This decorator is useful only when you previously applied AuthGuard
 */
export const DecodedToken = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.decodedToken;
  }
);

/**
 * This guard is responsible to ensure that the request comes with a valid access token
 */
@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private jwt: JwtService,
    private userRepository: UserRepository
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const bearerToken = request.headers.authorization;
    if (!bearerToken) {
      throw new TokenNotGivenError("Token not provided");
    }

    const [bearer, token] = bearerToken.split(" ");
    if (bearer !== "Bearer") {
      throw new BadRequestError("Token must be passed as 'Bearer <token>'");
    }

    if (!token) {
      throw new TokenNotGivenError("Token must be passed after 'Bearer'");
    }

    // Verifying access token
    let payload: UserAccessToken;
    try {
      const decodedPayload = await this.jwt.verify(token);
      payload = UserAccessToken.fromValues(decodedPayload);
    } catch (err) {
      throw new TokenNotValidError().withMetadata(err);
    }

    // Verifying expiration date
    if (payload.expirationTime.getTime() < Date.now()) {
      throw new TokenExpiredError();
    }

    // Verifying token type
    if (TokenTypes.ACCESS !== payload.type) {
      throw new BadRequestError(`Token must be ${TokenTypes.ACCESS} token`);
    }

    // Checking user existence
    const fetchedUsers = await this.userRepository.find(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      new ByUserIdCriteria(payload.user.id!)
    );
    const user = fetchedUsers[0];
    if (!user) {
      throw new BadRequestError(`User with id ${payload.user.id} not found`);
    }

    // Checking user role
    if (payload.user.userRole.name !== user.userRole.name) {
      throw new BadRequestError(
        "User role does not match with current user role"
      );
    }

    request.decodedToken = payload;
    return true;
  }
}
