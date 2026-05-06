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
}

export const ENEMY_STATS: Record<EnemyKind, EnemyStats> = {
  [EnemyKind.Doubtling]:   { hp:  30, speed:  88, bounty:  6, damage: 1, radius: 11, label: 'Doubtling' },
  [EnemyKind.PanicRunner]: { hp:  40, speed: 148, bounty:  9, damage: 1, radius: 10, label: 'Panic Runner' },
  [EnemyKind.GuiltGiant]:  { hp: 260, speed:  38, bounty: 30, damage: 3, radius: 22, label: 'Guilt Giant' },
  [EnemyKind.ShameSwarm]:  { hp:  22, speed:  78, bounty:  4, damage: 1, radius:  9, label: 'Shame Swarm' },
  [EnemyKind.EnvyLeech]:   { hp:  58, speed:  92, bounty: 13, damage: 1, radius: 12, label: 'Envy Leech' },
  [EnemyKind.BurnoutBrute]:{ hp: 360, speed:  34, bounty: 36, damage: 3, radius: 24, label: 'Burnout Brute' },
  [EnemyKind.VoidWraith]:  { hp:  68, speed: 112, bounty: 16, damage: 2, radius: 13, label: 'Void Wraith' },
  [EnemyKind.Overthinker]: { hp: 150, speed:  58, bounty: 24, damage: 2, radius: 18, label: 'Overthinker' },
  [EnemyKind.NumbOne]:     { hp: 125, speed:  66, bounty: 18, damage: 2, radius: 15, label: 'Numb One' },
  [EnemyKind.Spiral]:      { hp: 1800,speed:  34, bounty: 200,damage: 5, radius: 38, label: 'The Spiral' }
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
  ]
};
