import { createHash } from 'crypto';
// Authentication identity is separate from the wallet owning the account's assets.
// This module never receives a password/private key from the browser.
export type Proof = { code: string; codeVerifier: string };
export type Identity = { email: string; authWallet: string };
export type Account = { id: number; email: string; wallet: string | null };
export type Grant = {
  email: string; accountWallet: string | null; expectedAuthWallet: string;
  expiresAt: Date; consumedAt: Date | null;
};
export type Binding = { email: string; accountWallet: string | null; authWallet: string };
export interface RecoveryTransaction {
  account: Account;
  grant: Grant | null;
  binding: Binding | null;
  authWalletInUse: boolean;
  insertBinding(binding: Binding): Promise<void>;
  consumeGrant(): Promise<void>;
}
export interface RecoveryStore {
  transaction<T>(email: string, authWallet: string, proofDigest: string,
    work: (tx: RecoveryTransaction) => Promise<T>): Promise<T>;
}
export interface IdentityVerifier { verify(proof: Proof): Promise<Identity> }
export class RecoveryError extends Error {
  constructor(readonly status: number, readonly reason: string) { super(reason); }
}
const normalizeEmail = (value: string) => value.trim().toLowerCase();
const sameWallet = (a: string | null, b: string | null) =>
  (a || '').toLowerCase() === (b || '').toLowerCase();

export class RecoveryFlow {
  constructor(private verifier: IdentityVerifier, private store: RecoveryStore,
    private now: () => Date = () => new Date()) {}

  async run(mode: 'complete' | 'login', proof: Proof): Promise<{userId: number; walletChanged: boolean}> {
    if (!proof || typeof proof.code !== 'string' || typeof proof.codeVerifier !== 'string' ||
        !proof.code.length || proof.code.length > 4096 ||
        !proof.codeVerifier.length || proof.codeVerifier.length > 256) {
      throw new RecoveryError(400, 'INVALID_OAUTH_PROOF');
    }
    let identity: Identity;
    try { identity = await this.verifier.verify(proof); }
    catch { throw new RecoveryError(401, 'OAUTH_VERIFICATION_FAILED'); }
    if (!identity || typeof identity.email !== 'string' ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identity.email) ||
        !/^0x[0-9a-fA-F]{40}$/.test(identity.authWallet)) {
      throw new RecoveryError(401, 'INVALID_PROVIDER_IDENTITY');
    }
    const email = normalizeEmail(identity.email);
    const wallet = identity.authWallet.toLowerCase();
    const proofDigest = createHash('sha256').update(JSON.stringify([proof.code, proof.codeVerifier])).digest('hex');
    return this.store.transaction(email, wallet, proofDigest, async tx => {
      if (normalizeEmail(tx.account.email) !== email) throw new RecoveryError(403, 'RECOVERY_NOT_AUTHORIZED');
      const result = { userId: tx.account.id, walletChanged: !sameWallet(tx.account.wallet, wallet) };
      if (mode === 'login') {
        if (tx.authWalletInUse) throw new RecoveryError(409, 'AUTH_IDENTITY_ALREADY_BOUND');
        const b = tx.binding;
        if (!b || b.email !== email || !sameWallet(b.authWallet, wallet) ||
            !sameWallet(b.accountWallet, tx.account.wallet)) {
          throw new RecoveryError(403, 'RECOVERY_LOGIN_NOT_AUTHORIZED');
        }
        return result;
      }
      // No reset of a working account unless an operator explicitly reviewed it.
      const g = tx.grant;
      if (!g || g.consumedAt || !Number.isFinite(g.expiresAt.getTime()) || g.expiresAt.getTime() <= this.now().getTime() ||
          g.email !== email || !sameWallet(g.accountWallet, tx.account.wallet)) {
        throw new RecoveryError(403, 'RECOVERY_NOT_AUTHORIZED');
      }
      // Bind exactly the reviewed new identity, including when its wallet differs.
      if (!sameWallet(g.expectedAuthWallet, wallet)) throw new RecoveryError(409, 'AUTH_WALLET_REVIEW_REQUIRED');
      if (tx.binding || tx.authWalletInUse) throw new RecoveryError(409, 'AUTH_IDENTITY_ALREADY_BOUND');
      await tx.insertBinding({email, accountWallet: tx.account.wallet, authWallet: wallet});
      await tx.consumeGrant();
      return result;
    });
  }
}
