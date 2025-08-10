import { singleton } from 'tsyringe';
import path from 'path';
import fs from 'fs';
import * as dotenv from 'dotenv';
import { z } from 'zod';
import { EGameType } from 'types/enums/EGameType';

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
    squad: gameConfigSchema,
    squad44: gameConfigSchema
});


type EnvConfig = z.infer<typeof envSchema>;
type CoreConfig = z.infer<typeof coreConfigSchema>;


@singleton()
export class ConfigService {
    private readonly envConfig: EnvConfig;
    private readonly coreConfig: CoreConfig;
    private readonly pluginConfigs: Map<string, any> = new Map();

    constructor() {
        console.log('Initializing ConfigService...');
        this.envConfig = this._loadAndValidateEnv();
        this.coreConfig = this._loadAndValidateCoreConfig();
        this._loadAndValidatePluginConfigs();

        console.log('ConfigService initialized successfully.');
    }

    public getEnvConfig(): EnvConfig {
        return this.envConfig;
    }

    public getCoreConfig(): CoreConfig {
        return this.coreConfig;
    }

    public getPluginConfig<T>(pluginName: string, game: EGameType): T {
        const rawConfig = this.pluginConfigs.get(pluginName);
        if (!rawConfig) {
            throw new Error(`Attempted to get config for a plugin that was not loaded: ${pluginName}`);
        }

        const { squad, squad44, ...baseConfig } = rawConfig;
        const gameOverrides = rawConfig[game] || {};

        return { ...baseConfig, ...gameOverrides } as T;
    }


    private _loadAndValidateEnv(): EnvConfig {
        const envPath = path.resolve(process.cwd(), '.env');
        if (!fs.existsSync(envPath)) {
            throw new Error('.env file not found. Please create one from .env.example.');
        }
        dotenv.config({ path: envPath });

        const result = envSchema.safeParse(process.env);
        if (!result.success) {
            const errorMessages = result.error.issues.map(e => e.message).join('\n');
            throw new Error(`Invalid .env configuration:\n${errorMessages}`);
        }
        return result.data;
    }

    private _loadAndValidateCoreConfig(): CoreConfig {
        const configPath = path.resolve(process.cwd(), 'config', 'opensquad.json');
        try {
            const fileContents = fs.readFileSync(configPath, 'utf-8');
            const jsonData = JSON.parse(fileContents);

            const result = coreConfigSchema.safeParse(jsonData);
            if (!result.success) {
                const errorMessages = result.error.issues.map(e => e.message).join('\n');
                throw new Error(`Invalid config/opensquad.json configuration:\n${errorMessages}`);
            }
            return result.data;
        } catch (error: any) {
            if (error instanceof SyntaxError) {
                throw new Error(`Error parsing config/opensquad.json. Please check for syntax errors.`);
            }
            throw new Error(`Could not read config/opensquad.json: ${error.message}`);
        }
    }

    private _loadAndValidatePluginConfigs(): void {
        const enabledPlugins = [...this.coreConfig.squad.plugins, ...this.coreConfig.squad44.plugins];
        for (const pluginName of enabledPlugins) {
            const configPath = path.resolve(process.cwd(), 'config', 'plugins', `${pluginName}.json`);
            try {
                const fileContents = fs.readFileSync(configPath, 'utf-8');
                const jsonData = JSON.parse(fileContents);
                this.pluginConfigs.set(pluginName, jsonData);
            } catch (error: any) {
                if (error.code === 'ENOENT') {
                    throw new Error(`Configuration file not found for enabled plugin '${pluginName}' at: ${configPath}`);
                }
                if (error instanceof SyntaxError) {
                    throw new Error(`Error parsing ${configPath}. Please check for syntax errors.`);
                }
                throw new Error(`Could not read config for plugin '${pluginName}': ${error.message}`);
            }
        }
    }
}