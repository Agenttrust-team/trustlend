import { asyncHandler } from '../utils/asyncHandler.js';
import { query } from '../db/connection.js';
import { AppError } from '../errors/AppError.js';
import { fromStroops } from '../money/decimal.js';

const units = (value: string | null) => Number(fromStroops(BigInt(value ?? '0')));

/** A wallet-scoped summary for the home dashboard, derived from indexed events. */
export const listDashboardLoans = asyncHandler(async (req, res) => {
  const result = await query(
    `
    SELECT loan_id,
      MAX(amount) FILTER (WHERE event_type = 'LoanRequested')::text AS amount,
      MIN(ledger_closed_at) AS created_at,
      MAX(interest_rate_bps) FILTER (WHERE event_type = 'LoanApproved') AS rate,
      MAX(term_ledgers) FILTER (WHERE event_type = 'LoanApproved') AS term,
      (ARRAY_AGG(event_type ORDER BY ledger DESC, id DESC))[1] AS latest,
      BOOL_OR(event_type = 'LoanApproved') AS approved,
      SUM(CASE WHEN event_type = 'LoanRepaid' THEN amount ELSE 0 END)::text AS repaid
    FROM contract_events WHERE address = $1 AND loan_id IS NOT NULL
    GROUP BY loan_id ORDER BY loan_id DESC LIMIT 100`,
    [req.user!.publicKey],
  );
  res.json(
    result.rows.map((row) => ({
      id: String(row.loan_id),
      amount: units(row.amount),
      currency: process.env.POOL_TOKEN_SYMBOL ?? 'XLM',
      interestRate: Number(row.rate ?? 0) / 100,
      termDays: Number(row.term ?? 0) / 17280,
      borrowerId: req.user!.publicKey,
      createdAt: new Date(row.created_at).toISOString(),
      status:
        row.latest === 'LoanDefaulted'
          ? 'defaulted'
          : row.latest === 'LoanLiquidated'
            ? 'liquidated'
            : row.latest === 'LoanRepaid' && BigInt(row.repaid ?? '0') >= BigInt(row.amount ?? '0')
              ? 'repaid'
              : row.approved
                ? 'active'
                : 'pending',
    })),
  );
});

/** Native wallet balance and collateral locked through indexed contract events. */
export const getUserBalance = asyncHandler(async (req, res) => {
  const horizon =
    process.env.STELLAR_NETWORK === 'mainnet'
      ? 'https://horizon.stellar.org'
      : 'https://horizon-testnet.stellar.org';
  const response = await fetch(`${horizon}/accounts/${req.user!.publicKey}`, {
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok && response.status !== 404)
    throw AppError.serviceUnavailable('Unable to read wallet balance');
  const account = response.ok
    ? ((await response.json()) as { balances: Array<{ asset_type: string; balance: string }> })
    : { balances: [] };
  const collateral = await query(
    `SELECT COALESCE(SUM(CASE
      WHEN event_type = 'CollateralDeposited' THEN amount
      WHEN event_type IN ('CollateralReleased', 'CollateralLiquidated', 'CollateralReturned') THEN -amount
      ELSE 0 END), 0)::text AS locked
    FROM contract_events WHERE address = $1`,
    [req.user!.publicKey],
  );
  res.json({
    available: Number(account.balances.find((b) => b.asset_type === 'native')?.balance ?? '0'),
    locked: Math.max(0, units(collateral.rows[0]?.locked)),
    currency: 'XLM',
  });
});
