import { DependencyContainer } from 'tsyringe';
import { ConfigService } from 'services/Config.service';
import { LoggerService } from 'services/Logger.service';
import { LOG_READER_CONFIG, LogReaderConfig, LogReaderSource } from '../types/services/LogReaderConfig.interface';
import { EGameType, ENUM_GAME_TYPE } from '../types/enums/EGameType';

export const registerServices = (container: DependencyContainer): void => {
    const configService = container.resolve(ConfigService);
    const logger = container.resolve(LoggerService);

    container.register(LOG_READER_CONFIG, {
        useValue: {
            source: LogReaderSource.LOCAL,
            path: configService.getCoreConfig().squad44.logs.path,
        } as LogReaderConfig,
    });

    container.register(ENUM_GAME_TYPE, {
        useValue: EGameType.SQUAD44,
    });

    const coreConfig = configService.getCoreConfig();
    if (coreConfig.logging?.level) {
        logger.setLevel(coreConfig.logging.level);
        logger.debug('Log level set from configuration.');
    }
};
