import { EventManagerService } from "./services/EventManager.service";
import { IPluginDependencies } from "./types/IPluginDependencies.interface";
import { IPluginInfo } from "./types/IPluginInfo.interface";

export abstract class BasePlugin<T> {
    protected dependencies!: IPluginDependencies;
    protected config!: T;
    readonly pluginInfo: IPluginInfo;

    constructor(pluginInfo: IPluginInfo) {
        this.pluginInfo = pluginInfo;
    }

    public async init(dependencies: IPluginDependencies, config: T): Promise<void> {
        this.dependencies = dependencies;
        this.config = config;
        this.dependencies.logger.info(`Initializing plugin: ${this.pluginInfo.name}...`);
    }

    abstract shutdown(): Promise<void>;


    public getName(): string {
        return this.pluginInfo.name;
    }
}