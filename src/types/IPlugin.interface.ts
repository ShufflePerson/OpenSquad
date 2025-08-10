import { EventManagerService } from "services/EventManager.service";
import { LoggerService } from "services/Logger.service";
import { IPluginInfo } from "./IPluginInfo.interface";

export interface IPlugin {
    readonly info: IPluginInfo;
    config: any;

    onLoad?(): Promise<void> | void;
    onEnable?(): Promise<void> | void;
    onDisable?(): Promise<void> | void;
}


export type IPluginConstructor = new (
    logger: LoggerService,
    eventManager: EventManagerService,
    // Add other injectable services here if needed by all plugins
) => IPlugin;
