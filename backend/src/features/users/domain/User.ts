import { JsonSerializer } from "../../../shared/domain/JsonSerializer";
import { UserIdNotDefinedError } from "./UserId/UserIdNotDefinedError";
import { UserRole } from "../../roles/domain/UserRole";

export class User implements JsonSerializer {
  constructor(params: {
    username: string;
    firstname: string;
    lastname: string;
    email: string;
    password: string;
    walletAddress?: string;
    role: UserRole;
    resetPasswordCode?: string;
  }) {
    this._username = params.username;
    this._firstname = params.firstname;
    this._lastname = params.lastname;
    this._email = params.email;
    this._password = params.password;
    this._walletAddress = params.walletAddress;
    this._resetPasswordCode = params.resetPasswordCode;

    this._userRole = params.role;

    const now = new Date();
    this._createdAt = now;
    this._updatedAt = now;
  }

  private _walletAddress?: string;

  get walletAddress(): string | undefined {
    return this._walletAddress;
  }

  private _resetPasswordCode?: string;

  get resetPasswordCode(): string | undefined {
    return this._resetPasswordCode;
  }

  private _id?: number;

  get id(): number | undefined {
    return this._id;
  }

  private _username: string;

  get username(): string {
    return this._username;
  }

  private _firstname: string;

  get firstname(): string {
    return this._firstname;
  }

  private _lastname: string;

  get lastname(): string {
    return this._lastname;
  }

  private _email: string;

  get email(): string {
    return this._email;
  }

  private _password: string;

  get password(): string {
    return this._password;
  }

  private _userRole: UserRole;

  get userRole(): UserRole {
    return this._userRole;
  }

  private _encryptedPassword?: string;

  get encryptedPassword(): string | undefined {
    return this._encryptedPassword;
  }

  private _createdAt: Date;

  get createdAt(): Date {
    return this._createdAt;
  }

  private _updatedAt: Date;

  get updatedAt(): Date {
    return this._updatedAt;
  }

  withResetPasswordCode(resetPasswordCode: string): User {
    this._resetPasswordCode = resetPasswordCode;
    return this;
  }

  public withId(id: number): User {
    this._id = id;
    return this;
  }

  public withUsername(username: string): User {
    this._username = username;
    return this;
  }

  public withFirstname(firstname: string): User {
    this._firstname = firstname;
    return this;
  }

  public withLastname(lastname: string): User {
    this._lastname = lastname;
    return this;
  }

  public withEmail(email: string): User {
    this._email = email;
    return this;
  }

  public withWalletAddress(walletAddress: string): User {
    this._walletAddress = walletAddress;
    return this;
  }

  public withPassword(password: string): User {
    this._password = password;
    return this;
  }

  public withCreationDate(date: Date): User {
    this._createdAt = date;
    return this;
  }

  public withUpdateDate(date: Date): User {
    this._updatedAt = date;
    return this;
  }

  public withEncryptedPassword(encryptedPassword: string): User {
    this._encryptedPassword = encryptedPassword;
    return this;
  }

  public withUserRole(userRole: UserRole | string): User {
    this._userRole = userRole as UserRole;
    return this;
  }

  serialize() {
    if (!this.id) {
      throw new UserIdNotDefinedError();
    }

    if (!this.createdAt) {
    }

    return {
      id: this._id,
      username: this._username,
      firstname: this._firstname,
      lastname: this._lastname,
      email: this._email,
      created_at: this._createdAt.getTime(),
      updated_at: this._updatedAt.getTime(),
      role: this._userRole.serialize(),
      wallet_address: this.walletAddress,
    };
  }
}
