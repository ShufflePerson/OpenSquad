import "reflect-metadata"

import { container, injectable } from 'tsyringe';
import { ConfigService } from './services/Config.service';
import { LoggerService } from './services/Logger.service';
import { LogReaderService } from './services/LogReader.service';
import { LogParserService } from './services/LogParser/LogParser.service';
import { configureContainers } from './container';

@injectable()
class OpenSquad {
    constructor(
        private readonly logger: LoggerService,
        private readonly config: ConfigService,
        private readonly logReader: LogReaderService
    ) { }

    public async shutdown(): Promise<void> {
        this.logger.info('Shutting down OpenSquad.');
        process.exit(0);
    }
}

async function bootstrap() {
    const gameInstanceContainers = await configureContainers();
    const mainLogger = container.resolve(LoggerService);

    try {
        if (gameInstanceContainers.length > 0) {
            mainLogger.info(`${gameInstanceContainers.length} game instance(s) configured and starting...`);

            for (const gameContainer of gameInstanceContainers) {
                const logReader = gameContainer.resolve(LogReaderService);
                const logParser = gameContainer.resolve(LogParserService);
                logReader.onLogUpdate(logParser.parseLogChunk.bind(logParser));

                const openSquad = gameContainer.resolve(OpenSquad);
                logReader.start();

                process.on('SIGINT', () => openSquad.shutdown());
                process.on('SIGTERM', () => openSquad.shutdown());
            }
        } else {
            console.log('OpenSquad finished: No instances to run.');
        }
    } catch (error) {
        console.error('A fatal error occurred during OpenSquad startup.', error as Error);
        process.exit(1);
    }
}

bootstrap();
