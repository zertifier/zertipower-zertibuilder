import { Controller, Get, Query, Res } from "@nestjs/common";
import { Response } from "express";
import { OAuth2Client } from "google-auth-library";
import {
  EnvironmentService,
  PrismaService,
} from "../../../../../shared/infrastructure/services";
import { HttpResponse } from "../../../../../shared/infrastructure/http/HttpResponse";
import { UserNotFoundError } from "../../../../users/domain/errors";
import { OAuthServices } from "../../../domain/web2/OAuthServices";
import { InfrastructureError } from "../../../../../shared/domain/error/common";
import { User } from "../../../../users/domain/User";
import { UserRole } from "../../../../roles/domain/UserRole";
import { SaveUserAction } from "../../../../users/application/save-user-action/save-user-action";
import { FindUsersAction } from "../../../../users/application/find-users-action/find-users-action";
import { ByUserIdCriteria } from "../../../../users/domain/UserId/ByUserIdCriteria";
import { GenerateUserTokensAction } from "../../../application/generate-user-tokens-action/generate-user-tokens-action";
import { UserIdNotDefinedError } from "../../../../users/domain/UserId/UserIdNotDefinedError";

@Controller("oauth")
export class OauthController {
  private readonly oauthClient: OAuth2Client;
  constructor(
    private environment: EnvironmentService,
    private prisma: PrismaService,
    private saveUserAction: SaveUserAction,
    private findUserAction: FindUsersAction,
    private generateTokensAction: GenerateUserTokensAction
  ) {
    const clientId = this.environment.getEnv().GOOGLE_CLIENT_ID;
    const clientSecret = this.environment.getEnv().GOOGLE_CLIENT_SECRET;

    this.oauthClient = new OAuth2Client(
      clientId,
      clientSecret,
      "http://localhost:3000/oauth/google-callback"
    );
  }
  @Get("google")
  googleOauth(@Res() res: Response) {
    const authUrl = this.oauthClient.generateAuthUrl({
      access_type: "online",
      scope: [
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/userinfo.email",
      ],
    });

    res.redirect(authUrl);
  }

  @Get("google-callback")
  async googleCallback(
    @Query("code") code: string,
    @Res() res: Response
  ): Promise<any> {
    const tokenResponse = await this.oauthClient.getToken(code);

    this.oauthClient.setCredentials(tokenResponse.tokens);

    const response = await this.oauthClient.request<{
      id: string;
      email: string;
      name: string;
    }>({
      url: "https://www.googleapis.com/oauth2/v1/userinfo?alt=json",
    });

    let result;
    try {
      result = await this.prisma.userOatuh.findFirst({
        where: {
          type: OAuthServices.GOOGLE,
          oauth_id: response.data.id,
        },
      });
    } catch (err) {
      throw new InfrastructureError("Error getting local oauth data");
    }

    // If there is not a user associated with that account create new user
    let user: User;
    if (!result) {
      const userToSave = new User({
        role: UserRole.user(),
        email: response.data.email,
        firstname: response.data.name,
        lastname: "",
        username: response.data.name,
        password: "",
      });
      user = await this.saveUserAction.run(userToSave);
      if (!user.id) {
        throw new UserIdNotDefinedError();
      }

      try {
        await this.prisma.userOatuh.create({
          data: {
            user_id: user.id,
            oauth_id: response.data.id,
            type: OAuthServices.GOOGLE,
          },
        });
      } catch (err) {
        throw new InfrastructureError("Error saving user oauth");
      }
    } else {
      const users = await this.findUserAction.run(
        new ByUserIdCriteria(result.user_id)
      );
      user = users[0];
      if (!user) {
        throw new UserNotFoundError("User linked to google account not found");
      }
    }

    // Login and redirect to frontend
    const tokens = await this.generateTokensAction.run(user);

    res.redirect(
      `${
        this.environment.getEnv().FRONTEND_URL
      }/auth/oauth-callback?access_token=${
        tokens.signedAccessToken
      }&refresh_token=${tokens.signedRefreshToken}`
    );
  }

  @Get("twitter")
  twitterOauth() {
    return HttpResponse.success("TODO implement route");
  }
  @Get("facebook")
  facebookOauth() {
    return HttpResponse.success("TODO implement route");
  }
}
