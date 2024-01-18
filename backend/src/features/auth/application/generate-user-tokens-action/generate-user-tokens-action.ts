import { Injectable } from "@nestjs/common";
import { User } from "../../../users/domain/User";
import { JwtService } from "../../domain/tokens/services/JwtService";
import { AuthTokenRepository } from "../../domain/tokens/repositories/AuthTokenRepository";
import { UserAccessToken } from "../../domain/tokens/UserAccessToken";
import { UserRefreshToken } from "../../domain/tokens/UserRefreshToken";
import { UnexpectedError } from "../../../../shared/domain/error/common";

@Injectable()
export class GenerateUserTokensAction {
  constructor(
    private jwtService: JwtService,
    private authRepository: AuthTokenRepository
  ) {}

  /**
   * This method generates and saves the access and refresh token for provided user
   * @param user
   */
  async run(user: User) {
    // Creating tokens
    const accessToken = new UserAccessToken(user);
    const refreshToken = new UserRefreshToken(user);
    if (!refreshToken.expirationTime || !accessToken.expirationTime) {
      throw new UnexpectedError("Error creating tokens").withMetadata(
        "Expiration time is not set"
      );
    }

    const signedRefreshToken = await this.jwtService.sign(refreshToken);
    const signedAccessToken = await this.jwtService.sign(accessToken);

    // Saving refresh token
    await this.authRepository.save(
      signedRefreshToken,
      user,
      new Date(refreshToken.expirationTime)
    );
    return { signedAccessToken, signedRefreshToken };
  }
}
