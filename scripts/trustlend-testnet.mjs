// Resumable testnet deployment. Secrets stay in ignored backend/.env.
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
const require = createRequire(new URL('../backend/package.json', import.meta.url));
const { Keypair, Asset, Networks } = require('@stellar/stellar-sdk');
const { parse } = require('dotenv');
const envPath = new URL('../backend/.env', import.meta.url);
const existing = existsSync(envPath) ? parse(readFileSync(envPath)) : {};
const provisioned = parse(readFileSync('/tmp/trustlend-vercel.env'));
const admin = existing.LOAN_MANAGER_ADMIN_SECRET ? Keypair.fromSecret(existing.LOAN_MANAGER_ADMIN_SECRET) : Keypair.random();
const config = {
  ...existing, DATABASE_URL: provisioned.DATABASE_URL, REDIS_URL: provisioned.REDIS_URL,
  JWT_SECRET: existing.JWT_SECRET ?? randomBytes(48).toString('hex'),
  INTERNAL_API_KEY: existing.INTERNAL_API_KEY ?? randomBytes(48).toString('hex'),
  CRON_SECRET: existing.CRON_SECRET ?? randomBytes(48).toString('hex'),
  FRONTEND_URL: 'https://trustlend.vercel.app',
  STELLAR_NETWORK: 'testnet', STELLAR_RPC_URL: 'https://soroban-testnet.stellar.org',
  STELLAR_NETWORK_PASSPHRASE: 'Test SDF Network ; September 2015',
  LOAN_MANAGER_ADMIN_SECRET: admin.secret(), ADMIN_WALLETS: admin.publicKey(),
  JWT_COOKIE_NAME: 'trustlend_jwt', LOAN_MIN_SCORE: '500', LOAN_MAX_AMOUNT: '50000',
  LOAN_INTEREST_RATE_PERCENT: '12', CREDIT_SCORE_THRESHOLD: '600',
  SCORE_DELTA_REPAY: '15', SCORE_DELTA_DEFAULT: '-50', SCORE_DELTA_LATE: '-30',
  DB_POOL_MAX: '3', DB_POOL_MIN: '0', LOG_LEVEL: 'info',
};
function save() { writeFileSync(envPath, Object.entries(config).map(([k,v]) => `${k}=${JSON.stringify(v)}`).join('\n')+'\n', { mode: 0o600 }); }
save();
const childEnv = { ...process.env, STELLAR_ACCOUNT: admin.secret(), STELLAR_NETWORK: 'testnet' };
function stellar(args) {
  const result = spawnSync('stellar', args, { env: childEnv, encoding: 'utf8', timeout: 240000 });
  if (result.status !== 0) { console.error(result.stderr); throw new Error(`Stellar ${args.slice(0,3).join(' ')} failed`); }
  return result.stdout.trim();
}
const funded = await fetch(`https://horizon-testnet.stellar.org/accounts/${admin.publicKey()}`);
if (funded.status === 404) {
  const result = await fetch(`https://friendbot.stellar.org/?addr=${admin.publicKey()}`);
  if (!result.ok) throw new Error('Testnet funding failed');
}
console.log('Testnet administrator:', admin.publicKey());
for (const [name,key] of Object.entries({remittance_nft:'REMITTANCE_NFT_CONTRACT_ID',lending_pool:'LENDING_POOL_CONTRACT_ID',loan_manager:'LOAN_MANAGER_CONTRACT_ID',multisig_governance:'MULTISIG_GOVERNANCE_CONTRACT_ID'})) {
  if (!config[key]) { config[key] = stellar(['contract','deploy','--wasm',`contracts/target/wasm32v1-none/release/${name}.wasm`]); save(); }
  console.log(name,config[key]);
}
if (!config.POOL_TOKEN_ADDRESS) { config.POOL_TOKEN_ADDRESS=Asset.native().contractId(Networks.TESTNET); save(); }
const statePath='/tmp/trustlend-initialization.json';
const completed=existsSync(statePath)?JSON.parse(readFileSync(statePath)):[];
const calls=[
 ['nft-init',config.REMITTANCE_NFT_CONTRACT_ID,'initialize','--admin',admin.publicKey()],
 ['minter',config.REMITTANCE_NFT_CONTRACT_ID,'authorize_minter','--minter',config.LOAN_MANAGER_CONTRACT_ID],
 ['pool-init',config.LENDING_POOL_CONTRACT_ID,'initialize','--admin',admin.publicKey()],
 ['manager-init',config.LOAN_MANAGER_CONTRACT_ID,'initialize','--nft_contract',config.REMITTANCE_NFT_CONTRACT_ID,'--lending_pool',config.LENDING_POOL_CONTRACT_ID,'--token',config.POOL_TOKEN_ADDRESS,'--admin',admin.publicKey()],
 ['nft-manager',config.REMITTANCE_NFT_CONTRACT_ID,'set_loan_manager','--loan_manager',config.LOAN_MANAGER_CONTRACT_ID],
 ['governance-init',config.MULTISIG_GOVERNANCE_CONTRACT_ID,'initialize','--admin',admin.publicKey(),'--target_contract',config.LOAN_MANAGER_CONTRACT_ID],
];
for (const [label,id,...args] of calls) {
 if(completed.includes(label)) continue;
 stellar(['contract','invoke','--id',id,'--',...args]);
 completed.push(label);writeFileSync(statePath,JSON.stringify(completed));console.log('Initialized',label);
}
const publicConfig=Object.fromEntries(Object.entries(config).filter(([k])=>k.endsWith('CONTRACT_ID')||k==='POOL_TOKEN_ADDRESS'));
writeFileSync('docs/trustlend-testnet.json',JSON.stringify({network:'testnet',deployedAt:new Date().toISOString(),admin:admin.publicKey(),tokenSymbol:'XLM',...publicConfig},null,2)+'\n');
console.log('Testnet deployment complete. Private settings saved in backend/.env.');
