import { EventManagerService } from "@/services/EventManager.service";
import { LoggerService } from "@/services/Logger.service";
import { IPluginInfo } from "./IPluginInfo.interface";

export interface IPluginDependencies {
    eventManager: EventManagerService;
    logger: LoggerService;
    pluginInfo: IPluginInfo;
}