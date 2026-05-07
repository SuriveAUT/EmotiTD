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
  [EnemyKind.Doubtling]:   { hp:  30, speed:  88, bounty:  7, damage: 1, radius: 11, label: 'Doubtling' },
  [EnemyKind.PanicRunner]: { hp:  40, speed: 148, bounty: 10, damage: 1, radius: 10, label: 'Panic Runner' },
  [EnemyKind.GuiltGiant]:  { hp: 250, speed:  38, bounty: 31, damage: 3, radius: 22, label: 'Guilt Giant' },
  [EnemyKind.ShameSwarm]:  { hp:  22, speed:  78, bounty:  5, damage: 1, radius:  9, label: 'Shame Swarm' },
  [EnemyKind.EnvyLeech]:   { hp:  56, speed:  92, bounty: 14, damage: 1, radius: 12, label: 'Envy Leech' },
  [EnemyKind.BurnoutBrute]:{ hp: 340, speed:  34, bounty: 38, damage: 3, radius: 24, label: 'Burnout Brute' },
  [EnemyKind.VoidWraith]:  { hp:  66, speed: 112, bounty: 17, damage: 2, radius: 13, label: 'Void Wraith' },
  [EnemyKind.Overthinker]: { hp: 145, speed:  58, bounty: 25, damage: 2, radius: 18, label: 'Overthinker' },
  [EnemyKind.NumbOne]:     { hp: 120, speed:  66, bounty: 19, damage: 2, radius: 15, label: 'Numb One' },
  [EnemyKind.Spiral]:      { hp: 1700,speed:  34, bounty: 230,damage: 5, radius: 38, label: 'The Spiral' },
  [EnemyKind.Mask]:        { hp: 1850,speed:  38, bounty: 260,damage: 5, radius: 37, label: 'The Mask' },
  [EnemyKind.BurnoutBoss]: { hp: 2100,speed:  30, bounty: 290,damage: 6, radius: 40, label: 'The Burnout' }
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
