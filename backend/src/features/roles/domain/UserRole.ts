import { JsonSerializer } from '../../../shared/domain/JsonSerializer';
import { UserRoleIdNotDefinedError } from './errors';

export class UserRole implements JsonSerializer {
  constructor(params: { name: string }) {
    this._name = params.name;
  }

  private _id?: number;

  get id(): number | undefined {
    return this._id;
  }

  private _name: string;

  get name(): string {
    return this._name;
  }

  withId(id: number): UserRole {
    this._id = id;
    return this;
  }

  withName(name: string): UserRole {
    this._name = name;
    return this;
  }

  isAdmin(): boolean {
    return this.name === 'ADMIN';
  }

  public static admin() {
    return new UserRole({ name: 'ADMIN' });
  }

  public static user() {
    return new UserRole({ name: 'USER' });
  }

  serialize() {
    if (!this.id) {
      throw new UserRoleIdNotDefinedError();
    }

    return {
      id: this.id,
      name: this.name,
    };
  }
}
