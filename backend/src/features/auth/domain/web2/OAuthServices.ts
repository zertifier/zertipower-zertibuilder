import { EnumValueObject } from '../../../../shared/domain/value-object';
import { InvalidArgumentError } from '../../../../shared/domain/error/common';

export enum OAuthServices {
  GOOGLE = 'GOOGLE',
}

export class OAuthService extends EnumValueObject<OAuthServices> {
  constructor(value: OAuthServices) {
    super(value, Object.values(OAuthServices));
  }

  public static fromValue(value: string): OAuthService {
    for (const enumValue of Object.values(OAuthServices)) {
      if (value === enumValue) {
        return new OAuthService(enumValue);
      }
    }

    throw new InvalidArgumentError(`Filter operator ${value} not valid`);
  }
  protected throwErrorForInvalidValue(value: OAuthServices): void {
    throw new InvalidArgumentError(`'${value}' is not a valid OAuthService`);
  }
}
