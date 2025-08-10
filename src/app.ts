import "reflect-metadata"
import { injectable } from 'tsyringe';
import { ConfigService } from './services/Config.service';
import { LoggerService } from './services/Logger.service';
import { LogReaderService } from './services/LogReader.service';
import { LogParserService } from './services/LogParser/LogParser.service';
import { configureContainer } from './container';

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
    const container = configureContainer();

    try {
        const logReader = container.resolve(LogReaderService);
        const logParser = container.resolve(LogParserService);
        logReader.onLogUpdate(logParser.parseLogChunk.bind(logParser));

        const openSquad = container.resolve(OpenSquad);
        logReader.start();

        process.on('SIGINT', () => openSquad.shutdown());
        process.on('SIGTERM', () => openSquad.shutdown());
    } catch (error) {
        console.error('A fatal error occurred during OpenSquad startup.', error as Error);
        process.exit(1);
    }
}

bootstrap();
