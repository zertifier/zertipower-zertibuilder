import { Body, Controller, HttpException, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { RecoveryError, RecoveryFlow, Proof } from './recovery-flow';
import { MysqlRecoveryStore } from './recovery-store';
import { ZertiauthVerifier } from './zertiauth-verifier';
import { UserRepository } from '../../users/domain/UserRepository';
import { ByUserIdCriteria } from '../../users/domain/UserId/ByUserIdCriteria';
import { GenerateUserTokensAction } from '../application/generate-user-tokens-action/generate-user-tokens-action';

@Controller('auth/credential-recovery')
export class RecoveryController {
  private flow: RecoveryFlow;
  constructor(verifier: ZertiauthVerifier, store: MysqlRecoveryStore,
    private users: UserRepository, private tokens: GenerateUserTokensAction) {
    this.flow = new RecoveryFlow(verifier, store);
  }
  @Post('complete')
  complete(@Body() proof: Proof, @Res({ passthrough: true }) res: Response) {
    return this.run('complete', proof, res);
  }
  @Post('login')
  login(@Body() proof: Proof, @Res({ passthrough: true }) res: Response) {
    return this.run('login', proof, res);
  }
  private async run(mode: 'complete' | 'login', proof: Proof, res: Response) {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Pragma', 'no-cache');
    try {
      const result = await this.flow.run(mode, proof);
      const [user] = await this.users.find(new ByUserIdCriteria(result.userId));
      if (!user) throw new RecoveryError(403, 'RECOVERY_NOT_AUTHORIZED');
      // Tokens describe the ORIGINAL user and original asset wallet, not the new login wallet.
      const { signedAccessToken, signedRefreshToken } = await this.tokens.run(user);
      return { success: true, data: {
        accessToken: signedAccessToken, refreshToken: signedRefreshToken,
        walletChanged: result.walletChanged,
      } };
    } catch (error) {
      if (error instanceof RecoveryError) throw new HttpException(error.reason, error.status);
      throw new HttpException('RECOVERY_UNAVAILABLE', 503);
    }
  }
}
