import 'reflect-metadata';
import axios from 'axios';
import { Wallet } from 'ethers';
import { ZertiauthVerifier } from './zertiauth-verifier';
import { MysqlRecoveryStore } from './recovery-store';
import { RecoveryController } from './recovery.controller';
import { RecoveryFlow } from './recovery-flow';

const oldWallet = '0x' + '1'.repeat(40);
const newWallet = '0x' + '2'.repeat(40);
const proof = {code: 'synthetic-code', codeVerifier: 'synthetic-verifier'};

describe('Provider verification', () => {
  afterEach(() => jest.restoreAllMocks());
  it('derives the address server-side and never returns the private key', async () => {
    const wallet = Wallet.createRandom();
    jest.spyOn(axios, 'post').mockResolvedValue({data: {success: true, data: {
      privateKey: wallet.privateKey, email: 'risc3@example.test'
    }}});
    const result = await new ZertiauthVerifier().verify(proof);
    expect(Object.keys(result).sort()).toEqual(['authWallet', 'email']);
    expect(result.authWallet === wallet.address.toLowerCase()).toBe(true);
    expect(axios.post).toHaveBeenCalledWith(
      'https://auth.zertifier.com/zauth/web3/credentials', proof,
      expect.objectContaining({maxRedirects: 0, timeout: 10000}));
  });
  it('redacts upstream request/response errors', async () => {
    jest.spyOn(axios, 'post').mockRejectedValue({response: {data: 'synthetic-secret'}});
    await expect(new ZertiauthVerifier().verify(proof)).rejects.toThrow('OAUTH_VERIFICATION_FAILED');
  });
  it('rejects missing provider identity', async () => {
    jest.spyOn(axios, 'post').mockResolvedValue({data: {data: {email: 'risc3@example.test'}}});
    await expect(new ZertiauthVerifier().verify(proof)).rejects.toThrow('OAUTH_VERIFICATION_FAILED');
  });
});

function databaseFixture(options: {duplicates?: boolean; failInsert?: boolean; replay?: boolean} = {}) {
  const statements: string[] = [];
  const conn = {
    beginTransaction: jest.fn(), commit: jest.fn(), rollback: jest.fn(), release: jest.fn(),
    execute: jest.fn(async (sql: string) => {
      statements.push(sql);
      if (sql.startsWith('SELECT id, email')) {
        const row = {id: 10, email: 'risc3@example.test', wallet_address: oldWallet};
        return [[row, ...(options.duplicates ? [row] : [])]];
      }
      if (sql.includes('FROM auth_recovery_grants')) return [[{
        email: 'risc3@example.test', account_wallet: oldWallet, expected_auth_wallet: newWallet,
        expires_utc: '2099-01-01T00:00:00.000Z', consumed_at: null,
      }]];
      if (sql.startsWith('INSERT INTO auth_recovery_bindings') && options.failInsert) throw new Error('synthetic-driver-detail');
      if (sql.startsWith('SELECT digest')) return [options.replay ? [{digest: 'synthetic'}] : []];
      return [[]];
    }),
  };
  const store = new MysqlRecoveryStore({pool: {getConnection: async () => conn}} as any);
  const flow = new RecoveryFlow({verify: async () => ({email: 'risc3@example.test', authWallet: newWallet})}, store);
  return {conn, statements, flow};
}

describe('MariaDB transaction adapter (mock driver)', () => {
  it('writes only recovery state and revokes sessions; never rewrites users or associations', async () => {
    const f = databaseFixture(); await f.flow.run('complete', proof);
    expect(f.conn.commit).toHaveBeenCalledTimes(1);
    expect(f.conn.rollback).not.toHaveBeenCalled();
    expect(f.statements.some(s => /^INSERT INTO auth_recovery_bindings/.test(s))).toBe(true);
    expect(f.statements.some(s => /^DELETE FROM user_tokens/.test(s))).toBe(true);
    expect(f.statements.some(s => /^(UPDATE|INSERT INTO|DELETE FROM) users\b/.test(s))).toBe(false);
    expect(f.statements.filter(s => /FOR UPDATE/.test(s)).length).toBe(3);
    expect(f.conn.release).toHaveBeenCalledTimes(1);
  });
  it('fails closed for duplicate email accounts', async () => {
    const f = databaseFixture({duplicates: true});
    await expect(f.flow.run('complete', proof)).rejects.toMatchObject({status: 403});
    expect(f.conn.commit).not.toHaveBeenCalled(); expect(f.conn.rollback).toHaveBeenCalled();
  });
  it('rolls back on database failure without exposing driver details', async () => {
    const f = databaseFixture({failInsert: true});
    await expect(f.flow.run('complete', proof)).rejects.toMatchObject({message: 'RECOVERY_STORAGE_UNAVAILABLE'});
    expect(f.conn.commit).not.toHaveBeenCalled(); expect(f.conn.rollback).toHaveBeenCalled();
  });
  it('rolls back on replay', async () => {
    const f = databaseFixture({replay: true});
    await expect(f.flow.run('complete', proof)).rejects.toMatchObject({status: 401});
    expect(f.conn.commit).not.toHaveBeenCalled(); expect(f.conn.rollback).toHaveBeenCalled();
  });
});

describe('Recovery controller', () => {
  afterEach(() => jest.restoreAllMocks());
  it('issues a session for the existing user and original wallet', async () => {
    jest.spyOn(RecoveryFlow.prototype, 'run').mockResolvedValue({userId: 10, walletChanged: true});
    const user = {id: 10, walletAddress: oldWallet};
    const users = {find: jest.fn(async () => [user])};
    const tokens = {run: jest.fn(async () => ({signedAccessToken: 'synthetic-access', signedRefreshToken: 'synthetic-refresh'}))};
    const controller = new RecoveryController({} as any, {} as any, users as any, tokens as any);
    const res = {setHeader: jest.fn()};
    const result = await controller.complete(proof, res as any);
    expect(tokens.run).toHaveBeenCalledWith(user);
    expect(result.data.walletChanged).toBe(true);
    expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-store');
  });
  it('sanitizes session creation failures', async () => {
    jest.spyOn(RecoveryFlow.prototype, 'run').mockResolvedValue({userId: 10, walletChanged: true});
    const controller = new RecoveryController({} as any, {} as any,
      {find: async () => [{id: 10}]} as any, {run: async () => {throw new Error('synthetic-sensitive-data');}} as any);
    await expect(controller.complete(proof, {setHeader: jest.fn()} as any)).rejects.toMatchObject({message: 'RECOVERY_UNAVAILABLE'});
  });
});
