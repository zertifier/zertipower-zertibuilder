import { JsonSerializer } from '../../../../shared/domain/JsonSerializer';

/**
 * A token is an abstract class which the variants of a JWT extends.
 */
export abstract class Token implements JsonSerializer {
  public abstract expirationTime: Date;

  public abstract serialize(): object;
}
