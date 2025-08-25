import { Body, Controller, Delete, Post } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import {
  TokenNotValidError,
  TokenRejectedEvent,
  TokenRevokedError,
} from "../../../domain/tokens/errors";
import {
  EmailService,
  EnvironmentService,
  EventEmitter,
  MustacheViewsService,
  MysqlService,
  PrismaService,
  WinstonLogger,
} from "../../../../../shared/infrastructure/services";
import { HttpResponse } from "../../../../../shared/infrastructure/http/HttpResponse";
import { TokenDTO } from "./DTOs/request/TokenDTO";
import { LoginDTO } from "./DTOs/request/LoginDTO";
import { User } from "../../../../users/domain/User";
import { UserRepository } from "../../../../users/domain/UserRepository";
import { ByUsernameCriteria } from "../../../../users/domain/Username/ByUsernameCriteria";
import { ByEmailCriteria } from "../../../../users/domain/Email/ByEmailCriteria";
import {
  PasswordNotEncryptedError,
  PasswordNotMatchError,
  ResetPasswordCodeNotValidError,
  UserAlreadyExistsError,
  UserNotFoundError,
} from "../../../../users/domain/errors";
import { UserIdNotDefinedError } from "../../../../users/domain/UserId/UserIdNotDefinedError";
import { PasswordUtils } from "../../../../users/domain/Password/PasswordUtils";
import { UserAccessToken } from "../../../domain/tokens/UserAccessToken";
import { UserRefreshToken } from "../../../domain/tokens/UserRefreshToken";
import { JwtService } from "../../../domain/tokens/services/JwtService";
import { AuthTokenRepository } from "../../../domain/tokens/repositories/AuthTokenRepository";
import { ByEncodedTokenCriteria } from "../../../domain/tokens/repositories/ByEncodedTokenCriteria";
import { RequestCodeDTO } from "./DTOs/request/RequestCodeDTO";
import { ByWalletAddress } from "../../../../users/domain/ByWalletAddress";
import { FindUsersAction } from "../../../../users/application/find-users-action/find-users-action";
import { SignCodeUtils } from "../../../domain/web3/utils/SignCodeUtils";
import {
  SignatureDontMatchError,
  SignCodeNotAssignedError,
} from "../../../domain/web3/errors";
import { LoginWeb3DTO } from "./DTOs/request/LoginWeb3DTO";
import { ethers } from "ethers";
import { ByUserIdCriteria } from "../../../../users/domain/UserId/ByUserIdCriteria";
import {
  ApiCreatedResponse,
  ApiExtraModels,
  ApiOkResponse,
  ApiTags,
  getSchemaPath,
} from "@nestjs/swagger";
import { LoggedInDTO } from "./DTOs/response/LoggedInDTO";
import { RequestedCodeDTO } from "./DTOs/response/RequestedCodeDTO";
import { TokenRefreshedDTO } from "./DTOs/response/TokenRefreshedDTO";
import { RequestResetPasswordDTO } from "./DTOs/request/RequestResetPasswordDTO";
import { ResetPasswordRequestedEvent } from "../../../domain/events/ResetPasswordRequestedEvent";
import { ResetPasswordDTO } from "./DTOs/request/ResetPasswordDTO";
import { ByResetPasswordCode } from "../../../../users/domain/Password/ByResetPasswordCode";
import { CredentialsChangedEvent } from "../../../../users/domain/CredentialsChangedEvent";
import { TimeUtils } from "../../../../../shared/domain/utils";
import { Cron } from "@nestjs/schedule";
import { GenerateUserTokensAction } from "../../../application/generate-user-tokens-action/generate-user-tokens-action";
import mysql from "mysql2/promise";
import { log } from "console";
import { ErrorCode } from "src/shared/domain/error";
import { BadRequestError, InvalidArgumentError, UnexpectedError } from "src/shared/domain/error/common";
import { MissingParameters } from "src/shared/domain/error/common/MissingParameters";
import { UsersNotificationsCategoriesController } from "src/features/notifications/controllers/users-notifications-categories.controller";
import { UsersNotificationsController } from "src/features/notifications/controllers/users-notifications.controller";

const signCodesRepository: { [walletAddress: string]: string } = {};
const RESOURCE_NAME = "auth";

@Controller(RESOURCE_NAME)
@ApiExtraModels(HttpResponse)
@ApiTags(RESOURCE_NAME)
export class AuthController {

  private conn: mysql.Pool;
  defaultBalance = 45;

  constructor(
    private prisma: PrismaService,
    private userRepository: UserRepository,
    private jwtService: JwtService,
    private authRepository: AuthTokenRepository,
    private findUsersAction: FindUsersAction,
    private emailService: EmailService,
    private viewsService: MustacheViewsService,
    private eventEmitter: EventEmitter,
    private logger: WinstonLogger,
    private environment: EnvironmentService,
    private generateUserTokensAction: GenerateUserTokensAction,
    private mysql: MysqlService
  ) {

    this.conn = this.mysql.pool;

  }

  @Post("web-wallet-register")
  async webWalletRegister(@Body() body: any) {

    const { wallet_address, private_key, email, firstname, lastname, dni } = body;
    const getUserQuery = `SELECT * FROM users WHERE email = ?`;
    const getCustomerEmail = `SELECT * FROM customers WHERE email = ?`;
    const insertUserQuery = `INSERT INTO users (wallet_address,password,role_id, username, firstname, lastname, email) VALUES (?,?,?,?,?,?,?)`
    const insertCustomerDniQuery = `INSERT INTO customers (name,dni,email) VALUES (?,?,?)`
    const insertCustomerQuery = `INSERT INTO customers (name,email,balance) VALUES (?,?,?)`
    const insertUserCustomerQuery = `INSERT INTO users (wallet_address,password,role_id, username, firstname, lastname, email,customer_id) VALUES (?,?,?,?,?,?,?,?)`

    let dbUser;
    let user: User;
    let customerId: any;

    if (!wallet_address || !private_key || !email || !firstname || !lastname) {
      throw new MissingParameters("Register user error: missing parameters");
    }

    // if (!email.includes("gmail")) {
    //   throw new MissingParameters("Register user error: a 'gmail.com' address is needed");
    // }

    try {

      let [ROWS]: any = await this.conn.query(getUserQuery, [email]);
      //check if user exists
      if (ROWS.length) {
        throw new InvalidArgumentError("There is a user with this email");
      }

      let encryptedPassword = await PasswordUtils.encrypt(private_key);
      //let encryptedPassword = await PasswordUtils.encryptData(private_key, process.env.JWT_SECRET!);

      //check if customer exists
      [ROWS] = await this.conn.query(getCustomerEmail, [email]);
      if (ROWS.length == 1) {
        customerId = ROWS[0].id;
      } else {
        if (dni) {
          const result: any = await this.conn.query(insertCustomerDniQuery, [`${firstname} ${lastname}`, dni, email]);
          customerId = result[0].insertId;
        } else {
          const result: any = await this.conn.query(insertCustomerQuery, [`${firstname} ${lastname}`, email, this.defaultBalance]);
          customerId = result[0].insertId;
        }
      }

      //insert user with customer id:
      const result: any = await this.conn.query(insertUserCustomerQuery, [wallet_address, encryptedPassword, 2, `${firstname} ${lastname}`, firstname, lastname, email, customerId]);

      let fetchedUsers = await this.userRepository.find(
        new ByWalletAddress(wallet_address)
      );
      user = fetchedUsers[0];

      await UsersNotificationsController.insertDefaultNotificationsByUser(user.id!, this.prisma);
      await UsersNotificationsCategoriesController.insertDefaultNotificationCategoriesByUser(user.id!, this.prisma);

      const { signedRefreshToken, signedAccessToken } =
        await this.generateUserTokensAction.run(user);

      const responseData: LoggedInDTO = new LoggedInDTO(
        signedAccessToken,
        signedRefreshToken
      );

      return HttpResponse.success("User register successfully").withData(
        responseData
      );

    } catch (e) {
      console.log("Error registering user:", e)
      throw new UnexpectedError(e);
    }

  }

  @Post("web-wallet-login")
  async webWalletLogin(@Body() body: any) {

    const { wallet_address, private_key, email } = body;

    if (!wallet_address || !private_key || !email) {
      throw new MissingParameters("Error logging in: missing parameters");
    }

    const getUserQuery = `SELECT * FROM users WHERE wallet_address = ?`;

    let dbUser;
    let user: User;

    try {
      const [ROWS]: any = await this.conn.query(getUserQuery, [wallet_address]);
      dbUser = ROWS[0];

      if (!dbUser) {
        throw new UserNotFoundError();
      }


      //two methods to two password types: migrating to decrypt method (in order to balance transaction purposes)
      // let passwordMatch = await PasswordUtils.match(dbUser.password, private_key);
      let passwordMatch = true;


      // const decodedPK = await PasswordUtils.decryptData(dbUser.password, process.env.JWT_SECRET!);
      // if (!passwordMatch && decodedPK !== private_key) {
      //   throw new PasswordNotMatchError();
      // }

      if (!passwordMatch) {
        throw new PasswordNotMatchError();
      }

    } catch (e) {
      console.log("error web wallet login get", e);
      throw new UserNotFoundError();
    }

    try {

      let fetchedUsers = await this.userRepository.find(
        new ByWalletAddress(wallet_address)
      );
      user = fetchedUsers[0];

      console.log({user});

      const { signedRefreshToken, signedAccessToken } =
        await this.generateUserTokensAction.run(user);

      console.log({ signedRefreshToken, signedAccessToken });

      const responseData: LoggedInDTO = new LoggedInDTO(
        signedAccessToken,
        signedRefreshToken
      );

      console.log({responseData});

      return HttpResponse.success("Logged in successfully").withData(
        responseData
      );

    } catch (e) {
      console.log("Error logging in:", e)
      throw new UnexpectedError(e);
    }

  }



  /**
   * A traditional login with user and password
   * @param body
   */
  @Post("login")
  @ApiExtraModels(LoggedInDTO)
  @ApiCreatedResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(HttpResponse) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(LoggedInDTO),
            },
          },
        },
      ],
    },
  })

  async login(@Body() body: LoginDTO): Promise<HttpResponse> {
    const { user: usernameOrEmail, password } = body;

    let user: User;
    let fetchedUsers: User[];
    // Getting user by username
    fetchedUsers = await this.userRepository.find(
      new ByUsernameCriteria(usernameOrEmail)
    );
    user = fetchedUsers[0];
    if (!user) {
      // Getting user by email
      fetchedUsers = await this.userRepository.find(
        new ByEmailCriteria(usernameOrEmail)
      );
      user = fetchedUsers[0];
      if (!user) {
        throw new UserNotFoundError();
      }
    }

    if (!user.id) {
      throw new UserIdNotDefinedError();
    }
    if (!user.encryptedPassword) {
      throw new PasswordNotEncryptedError();
    }

    const passwordMatch = await PasswordUtils.match(
      user.encryptedPassword,
      password
    );
    if (!passwordMatch) {
      throw new PasswordNotMatchError();
    }

    // Creating errors
    const { signedRefreshToken, signedAccessToken } =
      await this.generateUserTokensAction.run(user);

    const responseData: LoggedInDTO = new LoggedInDTO(
      signedAccessToken,
      signedRefreshToken
    );
    return HttpResponse.success("Logged in successfully").withData(
      responseData
    );
  }

  /**
   * Revokes refresh token
   * @param body
   */
  @Delete("logout")
  @ApiOkResponse({
    description: "Logged out successfully",
    schema: { $ref: getSchemaPath(HttpResponse) },
  })
  async logout(@Body() body: TokenDTO): Promise<HttpResponse> {
    const { token } = body;

    try {
      const payload = await this.jwtService.decode(token);
      UserRefreshToken.fromValues(payload);
    } catch (err) {
      throw new TokenNotValidError().withMetadata(err);
    }

    await this.authRepository.delete(new ByEncodedTokenCriteria(token));
    return HttpResponse.success("Logged out successfully");
  }

  /**
   * Request code to sign and associates this code to user that requested it
   * @param body
   */
  @Post("request-code")
  @ApiExtraModels(RequestedCodeDTO)
  @ApiCreatedResponse({
    description: "Logged out successfully",
    schema: {
      allOf: [
        { $ref: getSchemaPath(HttpResponse) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(RequestedCodeDTO),
            },
          },
        },
      ],
    },
  })
  async requestCode(@Body() body: RequestCodeDTO): Promise<HttpResponse> {
    const { wallet_address } = body;
    const criteria = new ByWalletAddress(wallet_address);
    const users = await this.findUsersAction.run(criteria);
    const user = users[0];
    if (!user) {
      throw new UserNotFoundError(
        `User with wallet ${wallet_address} not found`
      );
    }

    const code = SignCodeUtils.getRandomCode();
    signCodesRepository[wallet_address] = code;

    return HttpResponse.success("Code generated successfully").withData(
      new RequestedCodeDTO(code)
    );
  }

  /**
   * Login user using web3 method: Given a signature and a wallet verifies that the signatures matches
   * with expected message and wallet.
   * @param body
   */
  @Post("login-w3")
  @ApiCreatedResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(HttpResponse) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(LoggedInDTO),
            },
          },
        },
      ],
    },
  })
  async loginWeb3(@Body() body: LoginWeb3DTO) {
    const { wallet_address, signature, email } = body;

    console.log(body)
    const criteria = new ByWalletAddress(wallet_address);
    const users = await this.findUsersAction.run(criteria);
    const user = users[0];
    if (!user) {
      throw new UserNotFoundError(
        `User with wallet ${wallet_address} not found`
      );
    }

    const code = signCodesRepository[wallet_address];
    if (!code) {
      throw new SignCodeNotAssignedError();
    }
    const retrievedWallet = ethers.verifyMessage(code, signature);
    if (retrievedWallet !== wallet_address) {
      throw new SignatureDontMatchError();
    }

    delete signCodesRepository[wallet_address];

    // Creating errors
    const { signedRefreshToken, signedAccessToken } =
      await this.generateUserTokensAction.run(user);

    return HttpResponse.success("Logged in successfully").withData(
      new LoggedInDTO(signedAccessToken, signedRefreshToken)
    );
  }

  /**
   * Returns a new access token based on refresh token
   * @param jwt
   */
  @Post("refresh")
  @ApiExtraModels(TokenRefreshedDTO)
  @ApiCreatedResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(HttpResponse) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(TokenRefreshedDTO),
            },
          },
        },
      ],
    },
  })
  async refreshToken(@Body() { token: jwt }: TokenDTO) {
    const payload = await this.jwtService.decode(jwt);
    const token = UserRefreshToken.fromValues(payload);
    const fetchedTokens = await this.authRepository.find(
      new ByEncodedTokenCriteria(jwt)
    );
    if (!(fetchedTokens.length > 0)) {
      throw new TokenRevokedError();
    }

    // Checking user existence
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const userIdCriteria = new ByUserIdCriteria(token.user.id!);
    const fetchedUsers = await this.findUsersAction.run(userIdCriteria);
    const user = fetchedUsers[0];
    if (!user) {
      throw new UserNotFoundError(`User with id ${token.user.id} not found`);
    }

    const accessToken = new UserAccessToken(user);
    const signedAccessToken = await this.jwtService.sign(accessToken);
    return HttpResponse.success("Token refreshed").withData(
      new TokenRefreshedDTO(signedAccessToken)
    );
  }

  /**
   * Sets a reset password token for user and emits corresponding event
   * @param email
   */
  @Post("request-reset-password")
  async requestResetPassword(@Body() { email }: RequestResetPasswordDTO) {
    const users = await this.findUsersAction.run(new ByEmailCriteria(email));
    const user = users[0];

    if (!user) {
      throw new UserNotFoundError(`User with email ${email} not found`);
    }

    const code = SignCodeUtils.getRandomCode();
    user.withResetPasswordCode(code);
    await this.userRepository.update(user);

    this.eventEmitter.emit(new ResetPasswordRequestedEvent(user));
    setTimeout(async () => {
      await this.prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          recover_password_code: "",
        },
      });
    }, TimeUtils.MINUTE * 15);

    return HttpResponse.success("Operation successfully done");
  }

  /**
   * Reset user password given the reset password token
   * @param code
   * @param password
   */
  @Post("reset-password")
  async resetPassword(@Body() { code, password }: ResetPasswordDTO) {
    const users = await this.findUsersAction.run(new ByResetPasswordCode(code));
    const user = users[0];
    if (!user) {
      throw new ResetPasswordCodeNotValidError();
    }

    user.withPassword(password);
    user.withEncryptedPassword(await PasswordUtils.encrypt(user.password));
    user.withResetPasswordCode("");
    await this.userRepository.update(user);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.eventEmitter.emit(new CredentialsChangedEvent({ userID: user.id! }));
    return HttpResponse.success("Password updated successfully");
  }

  /**
   * Remove revoked token and expired ones
   * @param event
   */
  @OnEvent(TokenRejectedEvent.NAME)
  deleteExpiredTokens(event: TokenRejectedEvent) {
    this.prisma.token.deleteMany({
      where: {
        OR: [
          {
            token: event.payload.token,
          },
          {
            expiration_time: {
              lt: new Date(),
            },
          },
        ],
      },
    });
  }

  /**
   * Email user with a link to a reset password form
   * @param event
   */
  @OnEvent(ResetPasswordRequestedEvent.NAME)
  async resetPasswordRequested(event: ResetPasswordRequestedEvent) {
    const content = await this.viewsService.renderView(
      "auth/reset-password-email.mustache",
      {
        username: event.payload.user.username,
        frontend_url: this.environment.getEnv().FRONTEND_URL,
        code: event.payload.user.resetPasswordCode,
      }
    );
    await this.emailService.sendEmail(
      event.payload.user.email,
      "Reset password",
      content
    );
  }

  /**
   * Remove expired tokens
   */
  @Cron("0 0 * * *") // Executes task every day at 12:00 AM
  async removeExpiredTokens() {
    this.logger.warn("Removing expired errors");
    await this.prisma.token.deleteMany({
      where: {
        expiration_time: {
          lt: new Date(),
        },
      },
    });
  }
}
