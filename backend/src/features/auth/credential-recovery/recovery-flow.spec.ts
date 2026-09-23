import { RecoveryFlow, RecoveryStore, IdentityVerifier, RecoveryError, Binding, Grant } from './recovery-flow';

// Synthetic identities only; these names do not represent a live database test.
const oldWallet = '0x' + '1'.repeat(40);
const currentWallet = '0x' + '2'.repeat(40);
const proof = {code: 'synthetic-oauth-code', codeVerifier: 'synthetic-verifier'};
function fixture(name = 'risc3') {
  const now = new Date('2026-09-22T12:00:00Z');
  const identityAccount = {id: name === 'risc3' ? 10 : 20, email: name + '@example.test', wallet: oldWallet};
  const userData = { ...identityAccount, password: 'synthetic-incompatible-value', customerId: 77, cups: [1, 2], role: 'user' };
  const account = userData;
  let grant: Grant | null = {email: account.email, accountWallet: oldWallet,
    expectedAuthWallet: currentWallet, expiresAt: new Date(now.getTime() + 900000), consumedAt: null};
  let binding: Binding | null = null;
  let inUse = false;
  let failConsume = false;
  let creates = 0;
  const seen = new Set<string>();
  const verifier: IdentityVerifier = { verify: async () => ({email: account.email, authWallet: currentWallet}) };
  const store: RecoveryStore = {
    transaction: async (_email, _wallet, digest, work) => {
      let pending: Binding | null = binding;
      let consumed = false;
      const result = await work({account, grant, binding, authWalletInUse: inUse,
        insertBinding: async b => { pending = b; },
        consumeGrant: async () => {
          if (failConsume) throw new RecoveryError(503, 'RECOVERY_STORAGE_UNAVAILABLE');
          consumed = true;
        },
      });
      if (seen.has(digest)) throw new RecoveryError(401, 'OAUTH_PROOF_ALREADY_USED');
      seen.add(digest);
      // Transaction double: writes become visible only on successful completion.
      if (pending !== binding) creates++;
      binding = pending;
      if (consumed && grant) grant = {...grant, consumedAt: now};
      return result;
    },
  };
  return {flow: new RecoveryFlow(verifier, store, () => now), verifier, account, userData,
    binding: () => binding, creates: () => creates,
    setGrant: (g: Grant | null) => { grant = g; }, grant: () => grant!,
    setCollision: () => {inUse = true;}, failConsume: () => {failConsume = true;}};
}

describe('Opt-in credential recovery (synthetic accounts)', () => {
  it('does not alter a working jana account without explicit authorization', async () => {
    const f = fixture('jana'); f.setGrant(null);
    const before = JSON.stringify(f.userData);
    await expect(f.flow.run('complete', proof)).rejects.toMatchObject({status: 403});
    expect(JSON.stringify(f.userData)).toBe(before);
    expect(f.binding()).toBeNull();
  });
  it('recovers risc3 with the current provider identity and permits subsequent login', async () => {
    const f = fixture();
    await expect(f.flow.run('login', proof)).rejects.toMatchObject({status: 403});
    await expect(f.flow.run('complete', proof)).resolves.toEqual({userId: 10, walletChanged: true});
    await expect(f.flow.run('login', {...proof, code: 'fresh-synthetic-code'})).resolves.toEqual({userId: 10, walletChanged: true});
  });
  it('preserves the existing account, original wallet, password and associations', async () => {
    const f = fixture(); const before = JSON.stringify(f.userData);
    await f.flow.run('complete', proof);
    expect(JSON.stringify(f.userData)).toBe(before);
    expect(f.binding()?.accountWallet).toBe(oldWallet);
    expect(f.binding()?.authWallet).toBe(currentWallet);
  });
  it('consumes authorization once; never creates a duplicate binding or user', async () => {
    const f = fixture(); await f.flow.run('complete', proof);
    await expect(f.flow.run('complete', proof)).rejects.toMatchObject({status: 403});
    expect(f.creates()).toBe(1);
    expect(f.account.id).toBe(10);
  });
  it('rejects invalid OAuth without returning provider errors or mutating data', async () => {
    const f = fixture();
    f.verifier.verify = async () => { throw new Error('synthetic-sensitive-provider-payload'); };
    await expect(f.flow.run('complete', proof)).rejects.toMatchObject({status: 401, message: 'OAUTH_VERIFICATION_FAILED'});
    expect(f.binding()).toBeNull();
  });
  it('rejects malformed proof before calling the provider', async () => {
    const f = fixture(); const verify = jest.spyOn(f.verifier, 'verify');
    await expect(f.flow.run('complete', {code: '', codeVerifier: ''})).rejects.toMatchObject({status: 400});
    expect(verify).not.toHaveBeenCalled();
  });
  it('does not accept an unreviewed change in wallet', async () => {
    const f = fixture(); f.setGrant({...f.grant(), expectedAuthWallet: oldWallet});
    await expect(f.flow.run('complete', proof)).rejects.toMatchObject({status: 409});
    expect(f.binding()).toBeNull();
  });
  it('rejects expired authorization', async () => {
    const f = fixture(); f.setGrant({...f.grant(), expiresAt: new Date(0)});
    await expect(f.flow.run('complete', proof)).rejects.toMatchObject({status: 403});
  });
  it('rejects a wallet already associated with another account', async () => {
    const f = fixture(); f.setCollision();
    await expect(f.flow.run('complete', proof)).rejects.toMatchObject({status: 409});
  });
  it('rejects changes to the account email or original wallet after authorization', async () => {
    const f = fixture(); f.setGrant({...f.grant(), accountWallet: currentWallet});
    await expect(f.flow.run('complete', proof)).rejects.toMatchObject({status: 403});
    f.setGrant({...f.grant(), accountWallet: oldWallet, email: 'different@example.test'});
    await expect(f.flow.run('complete', proof)).rejects.toMatchObject({status: 403});
  });
  it('rejects a different OAuth identity after recovery', async () => {
    const f = fixture(); await f.flow.run('complete', proof);
    f.verifier.verify = async () => ({email: f.account.email, authWallet: oldWallet});
    await expect(f.flow.run('login', proof)).rejects.toMatchObject({status: 403});
  });
  it('rolls back binding if consumption fails', async () => {
    const f = fixture(); f.failConsume();
    await expect(f.flow.run('complete', proof)).rejects.toMatchObject({status: 503});
    expect(f.binding()).toBeNull(); expect(f.grant().consumedAt).toBeNull();
  });
  it('rejects successful proof replay', async () => {
    const f = fixture(); await f.flow.run('complete', proof);
    await expect(f.flow.run('login', proof)).rejects.toMatchObject({status: 401});
  });
  it('also supports recovery when the resulting wallet is unchanged', async () => {
    const f = fixture(); f.setGrant({...f.grant(), expectedAuthWallet: oldWallet});
    f.verifier.verify = async () => ({email: f.account.email, authWallet: oldWallet});
    await expect(f.flow.run('complete', proof)).resolves.toEqual({userId: 10, walletChanged: false});
  });
});
