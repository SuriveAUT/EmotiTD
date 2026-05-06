/* ------------------------------------------------------------------ *
 *  Economy
 * ------------------------------------------------------------------ */
export const ECONOMY = {
  startingMemory: 155,
  startingStability: 20,
  waveCompleteBonus: 24,
  interestPerWave: 0.04
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
