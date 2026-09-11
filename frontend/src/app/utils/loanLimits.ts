// Score band thresholds
export const EXCELLENT_SCORE_THRESHOLD = 750;
export const GOOD_SCORE_THRESHOLD = 670;
export const FAIR_SCORE_THRESHOLD = 580;
export const MINIMUM_ELIGIBLE_SCORE_THRESHOLD = 500;

// Maximum loan amounts per score band
export const EXCELLENT_SCORE_MAX_LOAN = 50_000;
export const GOOD_SCORE_MAX_LOAN = 25_000;
export const FAIR_SCORE_MAX_LOAN = 10_000;
export const MINIMUM_SCORE_MAX_LOAN = 5_000;

// Default on-chain maximum loan limit fallback
export const DEFAULT_ONCHAIN_MAX_LOAN_AMOUNT = 50_000;

// Warning range
export const NEAR_MINIMUM_SCORE_DELTA = 40;

export function getScoreBandMax(score: number, maxContractAmount?: number): number {
  let tierLimit = 0;
  if (score >= EXCELLENT_SCORE_THRESHOLD) {
    tierLimit = EXCELLENT_SCORE_MAX_LOAN;
  } else if (score >= GOOD_SCORE_THRESHOLD) {
    tierLimit = GOOD_SCORE_MAX_LOAN;
  } else if (score >= FAIR_SCORE_THRESHOLD) {
    tierLimit = FAIR_SCORE_MAX_LOAN;
  } else if (score >= MINIMUM_ELIGIBLE_SCORE_THRESHOLD) {
    tierLimit = MINIMUM_SCORE_MAX_LOAN;
  } else {
    return 0;
  }

  if (
    typeof maxContractAmount === "number" &&
    Number.isFinite(maxContractAmount) &&
    maxContractAmount > 0
  ) {
    return Math.min(tierLimit, maxContractAmount);
  }

  return Math.min(tierLimit, DEFAULT_ONCHAIN_MAX_LOAN_AMOUNT);
}

