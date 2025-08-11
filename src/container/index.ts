import 'reflect-metadata';
import { container, DependencyContainer } from 'tsyringe';
import { registerServices } from './services';
import { registerParsers } from './parsers';
import { registerPlugins } from './plugins';
import { ConfigService } from '@/services/Config.service';
import { LoggerService } from '@/services/Logger.service';
import { bootstrapGameInstance } from './bootstrapGame';
import { EGameType } from '@/types/enums/EGameType';

export const configureContainers = async (): Promise<DependencyContainer[]> => {
    registerParsers(container);
    registerServices(container);
    await registerPlugins(container);

    const configService = container.resolve(ConfigService);
    const logger = container.resolve(LoggerService);

    const configuredInstances: DependencyContainer[] = [];
    const coreConfig = configService.getCoreConfig();


    if (coreConfig.squad?.enabled) {
        logger.info('Squad is enabled. Bootstrapping instance...');
        const squadContainer = container.createChildContainer();
        await bootstrapGameInstance(
            squadContainer,
            EGameType.SQUAD,
            coreConfig.squad
        );
        configuredInstances.push(squadContainer);
    } else {
        logger.info('Squad is disabled in the configuration.');
    }

    if (coreConfig.squad44?.enabled) {
        logger.info('Squad44 is enabled. Bootstrapping instance...');
        const squad44Container = container.createChildContainer();
        await bootstrapGameInstance(
            squad44Container,
            EGameType.SQUAD44,
            coreConfig.squad44
        );
        configuredInstances.push(squad44Container);
    } else {
        logger.info('Squad44 is disabled in the configuration.');
    }


    if (configuredInstances.length === 0) {
        logger.warn('No game instances were enabled. The application might not do anything.');
    }



    return configuredInstances;
};

export { container as parentContainer };