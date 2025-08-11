import { IPlugin } from "types/IPlugin.interface";
import { LoggerService } from "services/Logger.service";
import { EventManagerService } from "services/EventManager.service";
import { IEventTakeDamage } from "types/services/LogParser/IParsedLog";


export default class DamageLoggerPlugin implements IPlugin {
    public readonly info!: IPlugin['info'];
    public config: any;

    constructor(
        private readonly logger: LoggerService,
        private readonly eventManager: EventManagerService
    ) { }

    public onEnable(): void {
        this.eventManager.on('TAKE_DAMAGE', this.onTakeDamage);
        this.logger.info(`Now listening for damage events.`);
    }

    public onDisable(): void {
        this.eventManager.off('TAKE_DAMAGE', this.onTakeDamage);
        this.logger.info(`Stopped listening for damage events.`);
    }

    private onTakeDamage = (log: IEventTakeDamage): void => {
        console.log(log);
    }
}
