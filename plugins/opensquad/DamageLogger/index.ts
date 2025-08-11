import { IEventTakeDamage } from "types/services/LogParser/IParsedLog";
import { BasePlugin } from "@/BasePlugin";
import { IPluginDependencies } from "@/types/IPluginDependencies.interface";
import { EEventType } from "@/types/enums/EEventType";

interface IDamageLoggerConfig {
    message: string;
}

export default class DamageLoggerPlugin extends BasePlugin<IDamageLoggerConfig> {
    public async init(dependencies: IPluginDependencies, config: IDamageLoggerConfig): Promise<void> {
        await super.init(dependencies, config);
        this.dependencies.eventManager.on(EEventType.TAKE_DAMAGE, this.onTakeDamage);
        this.dependencies.logger.info(`${this.getName()} has been initialized successfully.`);
    }

    public async shutdown(): Promise<void> {
        this.dependencies.logger.info(`Shutting down ${this.getName()}...`);
        this.dependencies.logger.info(`${this.getName()} has been shut down.`);
    }

    private onTakeDamage = (event: IEventTakeDamage) => {
        console.log(`${this.config.message}: Damage for ${event.data.damage}hp`);
    }
}
