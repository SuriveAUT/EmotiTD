import { EnemyKind } from '../game/types';

/* ------------------------------------------------------------------ *
 *  Enemy stats
 * ------------------------------------------------------------------ */
export interface EnemyStats {
  hp: number;
  speed: number;     // pixels per second
  bounty: number;
  damage: number;    // damage to core on reach
  radius: number;
  label: string;
  slowResist?: number;
  stunResist?: number;
}

export const ENEMY_STATS: Record<EnemyKind, EnemyStats> = {
  [EnemyKind.Doubtling]:   { hp:  34, speed:  88, bounty:  2, damage: 1, radius: 11, label: 'Doubtling', slowResist: 0, stunResist: 0 },
  [EnemyKind.PanicRunner]: { hp:  46, speed: 152, bounty:  3, damage: 1, radius: 10, label: 'Panic Runner', slowResist: 0.25, stunResist: 0.20 },
  [EnemyKind.GuiltGiant]:  { hp: 280, speed:  38, bounty: 12, damage: 3, radius: 22, label: 'Guilt Giant', slowResist: 0.10, stunResist: 0.35 },
  [EnemyKind.ShameSwarm]:  { hp:  26, speed:  80, bounty:  1, damage: 1, radius:  9, label: 'Shame Swarm', slowResist: 0, stunResist: 0 },
  [EnemyKind.EnvyLeech]:   { hp:  68, speed:  94, bounty:  5, damage: 1, radius: 12, label: 'Envy Leech', slowResist: 0.15, stunResist: 0.20 },
  [EnemyKind.BurnoutBrute]:{ hp: 390, speed:  34, bounty: 15, damage: 3, radius: 24, label: 'Burnout Brute', slowResist: 0.20, stunResist: 0.40 },
  [EnemyKind.VoidWraith]:  { hp:  82, speed: 116, bounty:  6, damage: 2, radius: 13, label: 'Void Wraith', slowResist: 0.35, stunResist: 0.45 },
  [EnemyKind.Overthinker]: { hp: 175, speed:  58, bounty:  9, damage: 2, radius: 18, label: 'Overthinker', slowResist: 0.15, stunResist: 0.25 },
  [EnemyKind.NumbOne]:     { hp: 150, speed:  66, bounty:  7, damage: 2, radius: 15, label: 'Numb One', slowResist: 0.65, stunResist: 0.90 },
  [EnemyKind.Spiral]:      { hp: 1900,speed:  34, bounty: 50,damage: 5, radius: 38, label: 'The Spiral', slowResist: 0.55, stunResist: 0.85 },
  [EnemyKind.Mask]:        { hp: 2150,speed:  38, bounty: 88,damage: 5, radius: 37, label: 'The Mask', slowResist: 0.60, stunResist: 0.85 },
  [EnemyKind.BurnoutBoss]: { hp: 2450,speed:  30, bounty: 120,damage: 6, radius: 40, label: 'The Burnout', slowResist: 0.65, stunResist: 0.90 }
};

export const ENEMY_TRAITS: Record<EnemyKind, string[]> = {
  [EnemyKind.Doubtling]: [
    'Dodges the first hit and takes reduced damage.',
    'Low damage, steady pressure.'
  ],
  [EnemyKind.PanicRunner]: [
    'Fast enemy with short panic sprints.',
    'Slows and stuns suppress the sprint.'
  ],
  [EnemyKind.GuiltGiant]: [
    'High HP, slow movement.',
    'Small hits are partially armored.'
  ],
  [EnemyKind.ShameSwarm]: [
    'Weak, dense groups.',
    'Death pulse speeds up nearby enemies.'
  ],
  [EnemyKind.EnvyLeech]: [
    'Siphons nearby Calm aura and support tempo for a short time.',
    'Fragile if focused before it reaches your support cluster.'
  ],
  [EnemyKind.BurnoutBrute]: [
    'Resists Anger and burning ground damage.',
    'Weak to Sadness and Calm damage.'
  ],
  [EnemyKind.VoidWraith]: [
    'Teleports short distances along the path.',
    'Fragile, but punishes late targeting.'
  ],
  [EnemyKind.Overthinker]: [
    'Stops to overthink, then splits into smaller thoughts.',
    'Kill it before the pulse to prevent the split.'
  ],
  [EnemyKind.NumbOne]: [
    'Strongly resists slows, stuns and debuffs.',
    'Hope damage cracks its shell.'
  ],
  [EnemyKind.Spiral]: [
    'Boss: periodically disrupts emotional balance.',
    'Spawns Doubtlings while alive.'
  ],
  [EnemyKind.Mask]: [
    'Boss: temporarily resists your top damage emotion.',
    'Forces mixed damage and flexible targeting.'
  ],
  [EnemyKind.BurnoutBoss]: [
    'Boss: creates Overheat zones around towers.',
    'Overheated towers fire more slowly until the zone fades.'
  ]
};
