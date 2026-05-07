/* ------------------------------------------------------------------ *
 *  Economy
 * ------------------------------------------------------------------ */
export const ECONOMY = {
  startingMemory: 120,
  startingStability: 18,
  waveCompleteBonus: 4,
  interestPerWave: 0.012,
  interestCap: 18,
  coreShieldMax: 5,
  stabilityRegenCapPerWave: 1
} as const;

/* ------------------------------------------------------------------ *
 *  Emotional balance
 * ------------------------------------------------------------------ */
export const BALANCE = {
  resonanceUniqueThreshold: 3,
  resonanceFireRateMult: 0.92,    // <1 = faster
  resonanceDamageMult: 1.10,
  imbalanceDamageMult: 0.95,
  imbalanceCount: 4               // 4+ of same kind triggers imbalance
} as const;
