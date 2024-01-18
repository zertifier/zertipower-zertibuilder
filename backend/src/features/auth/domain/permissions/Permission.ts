import { UserRole } from "../../../roles/domain/UserRole";
import { JsonSerializer } from "../../../../shared/domain/JsonSerializer";

/**
 * A permission is a registry that specifies which actions can do each role over a resource route.
 * A resource is an abstract way to refer to an entity which an action can be applied.
 *
 * For example a customer is an entity which can apply CRUD actions.
 * Also actions like reset customer password, disable a customer, etc.
 * Then a customer can be a resource
 */
export class Permission implements JsonSerializer {
  constructor(params: {
    resource: string;
    action: string;
    role: UserRole;
    allow: boolean;
  }) {
    this._resource = params.resource;
    this._action = params.action;
    this._role = params.role;
    this._allow = params.allow;
  }

  private _allow: boolean;

  get allow(): boolean {
    return this._allow;
  }

  private _role: UserRole;

  get role(): UserRole {
    return this._role;
  }

  private _resource: string;

  get resource(): string {
    return this._resource;
  }

  private _action: string;

  get action(): string {
    return this._action;
  }

  withAllow(allow: boolean): Permission {
    this._allow = allow;
    return this;
  }

  withRole(role: UserRole): Permission {
    this._role = role;
    return this;
  }

  withAction(actionName: string): Permission {
    this._action = actionName;
    return this;
  }

  withResource(resourceName: string): Permission {
    this._resource = resourceName;
    return this;
  }

  serialize() {
    return {
      role: this.role,
      action: this.action,
      resource: this.resource,
      allow: this.allow,
    };
  }
}
