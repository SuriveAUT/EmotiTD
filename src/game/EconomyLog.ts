/* ------------------------------------------------------------------ *
 *  EconomyLog — per-wave economy tracker for balance analysis
 * ------------------------------------------------------------------ */

export interface WaveEconomyRow {
  wave: number;
  memStart: number;
  earnedBounties: number;
  earnedWaveBonus: number;
  earnedInterest: number;
  earnedTotal: number;
  spentTowers: number;
  spentUpgrades: number;
  spentTotal: number;
  memEnd: number;
  towersTotal: number;
  upgradesTotal: number;
  highestUpgLevel: number;
  activeSynergies: number;
  enemiesLeaked: number;
  coreDmgTaken: number;
}

export interface EconomySummary {
  totalMemoryEarned: number;
  totalMemorySpent: number;
  memoryFromBounties: number;
  memoryFromWaveBonuses: number;
  memoryFromInterest: number;
  towerCount: number;
  upgradeCount: number;
  highestUpgradeLevel: number;
  bestWaveReached: number;
}

export class EconomyLog {
  private rows: WaveEconomyRow[] = [];
  private current: WaveEconomyRow | null = null;

  /** Call at the START of each wave (before any income/spending) */
  beginWave(wave: number, currentMemory: number, towersTotal: number, upgradesTotal: number, activeSynergies: number): void {
    this.current = {
      wave,
      memStart: currentMemory,
      earnedBounties: 0,
      earnedWaveBonus: 0,
      earnedInterest: 0,
      earnedTotal: 0,
      spentTowers: 0,
      spentUpgrades: 0,
      spentTotal: 0,
      memEnd: currentMemory,
      towersTotal,
      upgradesTotal,
      highestUpgLevel: 0,
      activeSynergies,
      enemiesLeaked: 0,
      coreDmgTaken: 0
    };
  }

  recordBounty(amount: number): void {
    if (!this.current) return;
    this.current.earnedBounties += amount;
  }

  recordWaveBonus(amount: number): void {
    if (!this.current) return;
    this.current.earnedWaveBonus += amount;
  }

  recordInterest(amount: number): void {
    if (!this.current) return;
    this.current.earnedInterest += amount;
  }

  recordSpentTower(amount: number): void {
    if (!this.current) return;
    this.current.spentTowers += amount;
  }

  recordSpentUpgrade(amount: number): void {
    if (!this.current) return;
    this.current.spentUpgrades += amount;
  }

  recordEnemyLeaked(): void {
    if (!this.current) return;
    this.current.enemiesLeaked++;
  }

  recordCoreDamage(amount: number): void {
    if (!this.current) return;
    this.current.coreDmgTaken += amount;
  }

  /** Call at the END of each wave to commit the row */
  endWave(currentMemory: number, towersTotal: number, upgradesTotal: number, highestUpgLevel: number): void {
    if (!this.current) return;
    const r = this.current;
    r.memEnd = currentMemory;
    r.towersTotal = towersTotal;
    r.upgradesTotal = upgradesTotal;
    r.highestUpgLevel = highestUpgLevel;
    r.earnedTotal = r.earnedBounties + r.earnedWaveBonus + r.earnedInterest;
    r.spentTotal = r.spentTowers + r.spentUpgrades;
    this.rows.push({ ...r });
    this.current = null;
  }

  logReport(): void {
    if (this.rows.length === 0) {
      console.info('[EMOTICORE TD] EconomyLog: no waves recorded yet.');
      return;
    }
    console.group('[EMOTICORE TD] Economy Report — per wave');
    console.table(this.rows.map(r => ({
      'Wave':          r.wave,
      'Mem Start':     r.memStart,
      '+Bounties':     r.earnedBounties,
      '+WaveBonus':    r.earnedWaveBonus,
      '+Interest':     r.earnedInterest,
      '+Total':        r.earnedTotal,
      '-Towers':       r.spentTowers,
      '-Upgrades':     r.spentUpgrades,
      '-Total':        r.spentTotal,
      'Mem End':       r.memEnd,
      'TowersCnt':     r.towersTotal,
      'UpgCnt':        r.upgradesTotal,
      'MaxUpgLvl':     r.highestUpgLevel,
      'Synergies':     r.activeSynergies,
      'Leaked':        r.enemiesLeaked,
      'CoreDmg':       r.coreDmgTaken
    })));
    console.groupEnd();
  }

  summary(): EconomySummary {
    let totalEarned = 0, bounties = 0, waveBonuses = 0, interest = 0;
    let totalSpent = 0;
    let bestWave = 0;
    let highestUpgLevel = 0;
    let towerCount = 0;
    let upgradeCount = 0;

    for (const r of this.rows) {
      totalEarned += r.earnedTotal;
      bounties    += r.earnedBounties;
      waveBonuses += r.earnedWaveBonus;
      interest    += r.earnedInterest;
      totalSpent  += r.spentTotal;
      if (r.wave > bestWave) bestWave = r.wave;
      if (r.highestUpgLevel > highestUpgLevel) highestUpgLevel = r.highestUpgLevel;
      towerCount    = r.towersTotal;
      upgradeCount  = r.upgradesTotal;
    }

    return {
      totalMemoryEarned:  totalEarned,
      totalMemorySpent:   totalSpent,
      memoryFromBounties: bounties,
      memoryFromWaveBonuses: waveBonuses,
      memoryFromInterest: interest,
      towerCount,
      upgradeCount,
      highestUpgradeLevel: highestUpgLevel,
      bestWaveReached:    bestWave
    };
  }

  logSummary(label: string): void {
    const s = this.summary();
    console.group(`[EMOTICORE TD] Economy Summary — ${label}`);
    console.table([{
      'Total Earned':    s.totalMemoryEarned,
      'Total Spent':     s.totalMemorySpent,
      'From Bounties':   s.memoryFromBounties,
      'From WaveBonus':  s.memoryFromWaveBonuses,
      'From Interest':   s.memoryFromInterest,
      'Towers Built':    s.towerCount,
      'Upgrades Bought': s.upgradeCount,
      'Max Upg Level':   s.highestUpgradeLevel,
      'Best Wave':       s.bestWaveReached
    }]);
    console.groupEnd();
  }

  reset(): void {
    this.rows = [];
    this.current = null;
  }
}
