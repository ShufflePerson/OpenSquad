import { singleton, inject } from 'tsyringe';
import path from 'path';
import fs from 'fs';
import { LoggerService } from './Logger.service';
import { ConfigService } from './Config.service';
import { EventManagerService } from './EventManager.service';
import { EGameType } from 'types/enums/EGameType';
import { IPluginInfo } from 'types/IPluginInfo.interface';
import { pathToFileURL } from 'url';
import { BasePlugin } from '@/BasePlugin';
import { IPluginDependencies } from '@/types/IPluginDependencies.interface';

type PluginConstructor = new (pluginInfo: IPluginInfo) => BasePlugin<any>;


@singleton()
export class PluginManagerService {
    private readonly plugins: Map<string, BasePlugin<any>> = new Map();
    private readonly pluginsPath = path.resolve(process.cwd(), 'plugins/opensquad');

    constructor(
        private readonly logger: LoggerService,
        private readonly configService: ConfigService,
        private readonly eventManager: EventManagerService
    ) { }

    public async initializePlugins(gameType: EGameType): Promise<void> {
        this.logger.info(`Initializing plugins for ${gameType}...`);

        if (!fs.existsSync(this.pluginsPath)) {
            this.logger.warn(`Plugins directory not found at ${this.pluginsPath}. Skipping plugin loading.`);
            return;
        }

        const gameConfig = this.configService.getCoreConfig()[gameType];
        if (!gameConfig || !gameConfig.plugins || gameConfig.plugins.length === 0) {
            this.logger.info(`No plugins enabled for ${gameType}.`);
            return;
        }

        for (const pluginName of gameConfig.plugins) {
            await this.loadPlugin(pluginName, gameType);
        }

        this.logger.info(`All plugins for ${gameType} have been loaded and initialized.`);
    }

    private async loadPlugin(pluginName: string, gameType: EGameType): Promise<void> {
        const pluginPath = path.resolve(this.pluginsPath, pluginName);
        if (!fs.existsSync(pluginPath)) {
            this.logger.error(`Plugin directory not found for enabled plugin: ${pluginName}`);
            return;
        }

        try {
            const info = this.loadPluginInfo(pluginPath);
            if (info.name !== pluginName) {
                this.logger.warn(`Plugin folder name '${pluginName}' does not match plugin name '${info.name}' in its plugin.json.`);
            }

            const mainFilePath = path.resolve(process.cwd(), "dist", "plugins/opensquad", pluginName, info.main);
            if (!fs.existsSync(mainFilePath)) {
                throw new Error(`Main file '${info.main}' not found for plugin '${info.name}'.`);
            }

            const mainFileUrl = pathToFileURL(mainFilePath).href;
            const pluginModule = await import(mainFileUrl);

            if (!pluginModule.default) {
                throw new Error(`Plugin '${info.name}' must have a default export.`);
            }

            const PluginClass: PluginConstructor = pluginModule.default.default || pluginModule.default;

            const pluginInstance = new PluginClass(info);

            const dependencies: IPluginDependencies = {
                logger: this.logger,
                eventManager: this.eventManager,
                pluginInfo: info
            };
            const config = this.configService.getPluginConfig(info.name, gameType);

            await pluginInstance.init(dependencies, config);

            this.plugins.set(info.name, pluginInstance);
            this.logger.info(`Loaded and initialized plugin: ${info.name} v${info.version} by ${info.author}`);

        } catch (err) {
            this.logger.error(`Failed to load plugin '${pluginName}':`, err);
        }
    }

    private loadPluginInfo(pluginPath: string): IPluginInfo {
        const infoPath = path.resolve(pluginPath, 'plugin.json');
        if (!fs.existsSync(infoPath)) {
            throw new Error(`'plugin.json' not found at ${pluginPath}`);
        }
        const fileContents = fs.readFileSync(infoPath, 'utf-8');
        return JSON.parse(fileContents) as IPluginInfo;
    }

    public async shutdownPlugins(): Promise<void> {
        this.logger.info('Shutting down all plugins...');
        for (const [name, plugin] of this.plugins.entries()) {
            try {
                await plugin.shutdown();
                this.logger.info(`Shutdown plugin: ${name}`);
            } catch (err) {
                this.logger.error(`Error shutting down plugin ${name}:`, err);
            }
        }
        this.plugins.clear();
        this.logger.info('All plugins have been shut down.');
    }
}
