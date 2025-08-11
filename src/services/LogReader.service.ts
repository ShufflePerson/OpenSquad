import { inject, injectable } from "tsyringe";
import fs from "fs";
import chokidar from "chokidar";
import { LoggerService } from "./Logger.service";
import { LOG_READER_CONFIG, LogReaderConfig } from "types/services/LogReaderConfig.interface";

export type onNewLogCallback = (logChunk: string) => void;

@injectable()
export class LogReaderService {
    private lastFileSize: number = 0;
    private onNewLog: onNewLogCallback | null = null;

    constructor(
        private readonly logger: LoggerService,
        @inject(LOG_READER_CONFIG) private readonly config: LogReaderConfig
    ) {
    }

    public onLogUpdate(callback: onNewLogCallback): void {
        this.onNewLog = callback;
    }

    public start(): void {
        const logFile = this.config.path;
        this.logger.debug(`Using log source ${this.config.source} from ${logFile}`);

        try {
            const stats = fs.statSync(logFile);
            this.lastFileSize = stats.size;
        } catch (error) {
            this.logger.error(`Failed to access log file: ${logFile}. Please ensure it exists.`);
            return;
        }

        const watcher = chokidar.watch(logFile, {
            persistent: true,
            usePolling: true,
            awaitWriteFinish: {
                stabilityThreshold: 500,
                pollInterval: 100
            }
        });

        this.logger.debug(`Started watching ${logFile} at ${this.lastFileSize} bytes.`);

        watcher.on('change', (path, stats) => this._onFileChange(path, stats));
    }

    private _onFileChange(path: string, stats: fs.Stats | undefined): void {
        if (!stats) return;

        if (stats.size > this.lastFileSize) {
            const stream = fs.createReadStream(path, { start: this.lastFileSize, end: stats.size });
            stream.on('data', (chunk: string | Buffer) => {
                if (this.onNewLog) {
                    this.onNewLog(chunk.toString());
                }
            });
            stream.on('error', (err) => this.logger.error('Stream error:', err));
        }

        this.lastFileSize = stats.size;
    }
}