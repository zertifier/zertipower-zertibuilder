import { Injectable } from '@nestjs/common';
import { RowDataPacket } from 'mysql2/promise';
import { MysqlService } from '../../../shared/infrastructure/services/mysql-service/mysql.service';
import { RecoveryStore, RecoveryTransaction, RecoveryError, Binding, Grant } from './recovery-flow';

@Injectable()
export class MysqlRecoveryStore implements RecoveryStore {
  constructor(private mysql: MysqlService) {}
  async transaction<T>(email: string, authWallet: string, proofDigest: string,
    work: (tx: RecoveryTransaction) => Promise<T>): Promise<T> {
    const conn = await this.mysql.pool.getConnection();
    try {
      await conn.beginTransaction();
      const [users] = await conn.execute<RowDataPacket[]>(
        'SELECT id, email, wallet_address FROM users WHERE LOWER(TRIM(email)) = ? FOR UPDATE', [email]);
      if (users.length !== 1) throw new RecoveryError(403, 'RECOVERY_NOT_AUTHORIZED');
      const u = users[0];
      const [grants] = await conn.execute<RowDataPacket[]>(
        "SELECT *, DATE_FORMAT(expires_at, '%Y-%m-%dT%H:%i:%s.%fZ') AS expires_utc FROM auth_recovery_grants WHERE user_id = ? FOR UPDATE", [u.id]);
      const [bindings] = await conn.execute<RowDataPacket[]>(
        'SELECT * FROM auth_recovery_bindings WHERE user_id = ? FOR UPDATE', [u.id]);
      const [collisions] = await conn.execute<RowDataPacket[]>(
        `SELECT user_id AS id FROM auth_recovery_bindings WHERE auth_wallet = ? AND user_id <> ?
         UNION ALL SELECT id FROM users WHERE LOWER(wallet_address) = ? AND id <> ?`,
        [authWallet, u.id, authWallet, u.id]);
      const g = grants[0], b = bindings[0];
      const grant: Grant | null = g ? {
        email: g.email, accountWallet: g.account_wallet, expectedAuthWallet: g.expected_auth_wallet,
        expiresAt: new Date(g.expires_utc), consumedAt: g.consumed_at ? new Date(g.consumed_at) : null,
      } : null;
      const binding: Binding | null = b ? {
        email: b.email, accountWallet: b.account_wallet, authWallet: b.auth_wallet,
      } : null;
      const result = await work({
        account: { id: u.id, email: u.email, wallet: u.wallet_address }, grant, binding,
        authWalletInUse: collisions.length !== 0,
        insertBinding: async value => {
          await conn.execute(
            `INSERT INTO auth_recovery_bindings (user_id, email, account_wallet, auth_wallet)
             VALUES (?, ?, ?, ?)`, [u.id, value.email, value.accountWallet, value.authWallet]);
        },
        consumeGrant: async () => {
          await conn.execute('UPDATE auth_recovery_grants SET consumed_at = UTC_TIMESTAMP(3) WHERE user_id = ?', [u.id]);
          // Existing access JWTs expire normally; revoke refresh sessions atomically.
          await conn.execute('DELETE FROM user_tokens WHERE user_id = ?', [u.id]);
        },
      });
      // Atomic replay protection, including simultaneous completion/login attempts.
      const [seen] = await conn.execute<RowDataPacket[]>(
        'SELECT digest FROM auth_recovery_proofs WHERE digest = ?', [proofDigest]);
      if (seen.length) throw new RecoveryError(401, 'OAUTH_PROOF_ALREADY_USED');
      await conn.execute('INSERT INTO auth_recovery_proofs (digest) VALUES (?)', [proofDigest]);
      await conn.commit();
      return result;
    } catch (error) {
      await conn.rollback();
      if (error instanceof RecoveryError) throw error;
      // Never propagate driver errors: they may contain SQL, tokens or credentials.
      throw new RecoveryError(503, 'RECOVERY_STORAGE_UNAVAILABLE');
    } finally { conn.release(); }
  }
}
