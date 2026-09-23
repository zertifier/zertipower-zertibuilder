import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { Wallet } from 'ethers';
import { IdentityVerifier, Identity, Proof } from './recovery-flow';

@Injectable()
export class ZertiauthVerifier implements IdentityVerifier {
  async verify(proof: Proof): Promise<Identity> {
    // Same exchange contract as @zertifier/zertiauthjs; performed server-side.
    // Never accept browser-supplied email, wallet or privateKey as identity proof.
    try {
      const response = await axios.post('https://auth.zertifier.com/zauth/web3/credentials', {
        code: proof.code, codeVerifier: proof.codeVerifier,
      }, { timeout: 10000, maxRedirects: 0, maxContentLength: 16384 });
      if (response.data?.success !== true) throw new Error();
      const data = response.data.data;
      if (typeof data?.email !== 'string' || typeof data?.privateKey !== 'string') throw new Error();
      const authWallet = new Wallet(data.privateKey).address.toLowerCase();
      return { email: data.email, authWallet };
    } catch {
      // Axios exceptions include request/response bodies: do not log or rethrow them.
      throw new Error('OAUTH_VERIFICATION_FAILED');
    }
  }
}
