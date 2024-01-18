import { Injectable } from "@nestjs/common";
import { Token } from "../../../domain/tokens/Token";
import * as jose from "jose";
import { JWTPayload } from "jose";
import { EnvironmentService } from "../../../../../shared/infrastructure/services";
import { JwtService } from "../../../domain/tokens/services/JwtService";

@Injectable()
export class JoseJWTService implements JwtService {
  private readonly secret: Uint8Array;

  constructor(private environment: EnvironmentService) {
    this.secret = new TextEncoder().encode(
      this.environment.getEnv().JWT_SECRET
    );
  }

  async sign(payload: Token) {
    const jwt = new jose.SignJWT(payload.serialize() as JWTPayload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt();

    if (payload.expirationTime) {
      jwt.setExpirationTime(payload.expirationTime.getTime());
    }

    return await jwt.sign(this.secret);
  }

  async decode(jwt: string): Promise<any> {
    return jose.decodeJwt(jwt);
  }

  async verify(jwt: string): Promise<any> {
    const { payload } = await jose.jwtVerify(jwt, this.secret);
    return payload;
  }
}
