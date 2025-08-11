import { PluginManagerService } from 'services/PluginManager.service';
import { DependencyContainer } from 'tsyringe';
import { EGameType } from 'types/enums/EGameType';

export const registerPlugins = async (container: DependencyContainer, gameType: EGameType): Promise<void> => {
    const pluginManager = container.resolve(PluginManagerService);
    await pluginManager.initializePlugins(gameType);
};
