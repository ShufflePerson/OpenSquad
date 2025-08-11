import { EGameType } from '@/types/enums/EGameType';
import { z } from 'zod';

const envSchema = z.object({
    DISCORD_BOT_TOKEN: z.string().min(1, 'DISCORD_BOT_TOKEN is required.'),
});

const gameConfigSchema = z.object({
    enabled: z.boolean(),
    rcon: z.object({
        host: z.string(),
        port: z.number().positive(),
    }),
    plugins: z.array(z.string()),
    logs: z.object({
        path: z.string()
    })
});

const coreConfigSchema = z.object({
    logging: z.object({
        level: z.enum(['debug', 'info', 'warn', 'error']),
    }).optional(),
    [EGameType.SQUAD]: gameConfigSchema,
    [EGameType.SQUAD44]: gameConfigSchema
});

type EnvConfig = z.infer<typeof envSchema>;
type CoreConfig = z.infer<typeof coreConfigSchema>;
type GameConfig = z.infer<typeof gameConfigSchema>;


export { EnvConfig, GameConfig, CoreConfig }
export { envSchema, gameConfigSchema, coreConfigSchema }