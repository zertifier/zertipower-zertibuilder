import { Module } from "@nestjs/common";
import { JwtService } from "../../domain/tokens/services/JwtService";
import { JoseJWTService } from "./jose-jwt/JoseJWT.service";

@Module({
  providers: [
    {
      provide: JwtService,
      useClass: JoseJWTService,
    },
  ],
  exports: [JwtService],
})
export class AuthServicesModule {}
