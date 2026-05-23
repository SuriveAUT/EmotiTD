import { z } from 'zod';

const NAME_REGEX = /^[A-Za-z0-9 _\-.]+$/;
const HTML_TAG_REGEX = /<[^>]*>/;

const playerNameSchema = z
  .string()
  .transform((s) => s.trim())
  .refine((s) => s.length >= 1 && s.length <= 18, {
    message: 'playerName must be 1-18 characters'
  })
  .refine((s) => !HTML_TAG_REGEX.test(s), {
    message: 'playerName must not contain HTML'
  })
  .refine((s) => NAME_REGEX.test(s), {
    message: 'playerName contains forbidden characters'
  });

const statsSchema = z
  .object({
    towersUsed: z.number().int().nonnegative().max(10_000).optional(),
    upgradesPurchased: z.number().int().nonnegative().max(100_000).optional(),
    killsTotal: z.number().int().nonnegative().max(1_000_000).optional(),
    bossKills: z.number().int().nonnegative().max(10_000).optional(),
    topDamageEmotion: z
      .string()
      .max(32)
      .regex(/^[a-z_]+$/i, 'topDamageEmotion has forbidden characters')
      .optional()
  })
  .strict()
  .optional();

export const scoreSubmitSchema = z
  .object({
    playerName: playerNameSchema,
    score: z.number().int().min(0).max(999_999_999),
    wave: z.number().int().min(1).max(999),
    mapId: z.string().min(1).max(64).regex(/^[a-z0-9_\-]+$/i, 'mapId has forbidden characters'),
    mapName: z.string().min(1).max(64),
    mode: z.string().min(1).max(32).regex(/^[a-z0-9_\-]+$/i, 'mode has forbidden characters'),
    result: z.enum(['victory', 'defeat', 'abandoned']).optional(),
    seed: z.string().max(64).optional(),
    stats: statsSchema,
    clientVersion: z.string().max(32).optional()
  })
  .strict();

export type ScoreSubmit = z.infer<typeof scoreSubmitSchema>;

export const scoreQuerySchema = z.object({
  limit: z
    .preprocess((v) => (v === undefined ? undefined : Number(v)), z.number().int().min(1).max(50))
    .default(10),
  mode: z.string().min(1).max(32).regex(/^[a-z0-9_\-]+$/i).optional()
});

export type ScoreQuery = z.infer<typeof scoreQuerySchema>;
