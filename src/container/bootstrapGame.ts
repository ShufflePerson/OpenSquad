import { LoggerService } from "@/services/Logger.service";
import { EGameType, ENUM_GAME_TYPE } from "@/types/enums/EGameType";
import { LOG_READER_CONFIG, LogReaderConfig, LogReaderSource } from "@/types/services/LogReaderConfig.interface";
import { registerParsers } from "./parsers";
import { registerPlugins } from "./plugins";
import { DependencyContainer } from "tsyringe";
import { GameConfig } from "@/schemas/config.schema";

export const bootstrapGameInstance = async (
    gameContainer: DependencyContainer,
    gameType: EGameType,
    config: GameConfig
): Promise<void> => {
    const logger = gameContainer.resolve(LoggerService);

    logger.info(`[${gameType}] Registering game-specific dependencies.`);

    gameContainer.register(ENUM_GAME_TYPE, {
        useValue: gameType,
    });

    gameContainer.register(LOG_READER_CONFIG, {
        useValue: {
            source: LogReaderSource.LOCAL,
            path: config.logs.path,
        } as LogReaderConfig,
    });

    registerParsers(gameContainer);
    await registerPlugins(gameContainer, gameType);

    logger.info(`[${gameType}] Instance bootstrapped successfully with log path "${config.logs.path}".`);
};
