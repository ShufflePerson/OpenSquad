import { PluginManagerService } from 'services/PluginManager.service';
import { DependencyContainer } from 'tsyringe';
import { EGameType } from 'types/enums/EGameType';

export const registerPlugins = async (container: DependencyContainer): Promise<void> => {
    const pluginManager = container.resolve(PluginManagerService);
    await pluginManager.initializePlugins(EGameType.SQUAD);
    await pluginManager.initializePlugins(EGameType.SQUAD44);
};
