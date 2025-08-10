import { inject, injectable } from "tsyringe";
import { LoggerService } from "services/Logger.service";
import { LogReaderService } from "services/LogReader.service";
import { EGameType, ENUM_GAME_TYPE } from "types/enums/EGameType";
import { IParsedLog } from "types/services/LogParser/IParsedLog";
import { TakeDamageParser } from "./parsers/TakeDamageParser";
import { EVENT_PARSER, IEventParser } from "types/services/LogParser/IEventParser";

@injectable()
export class LogParserService {

    constructor(
        private readonly logger: LoggerService,
        private readonly reader: LogReaderService,
        @inject(ENUM_GAME_TYPE) private readonly gameType: EGameType,
        @inject(EVENT_PARSER) private readonly parsers: IEventParser[]
    ) {
        this.logger.info(`[LogParserService] Initialized with ${this.parsers.length} parsers.`);
    }

    public parseLogChunk(logChunk: string): void {
        this.logger.debug(`[LogParserService] Received chunk of size: ${logChunk.length}`);
        const newLines = logChunk.split('\n').filter(line => line.trim() !== '');

        for (const line of newLines) {
            const parsedLog = this._parseLine(line);
            console.log(parsedLog)
        }
    }

    private _parseLine(line: string): IParsedLog | null {
        try {
            const timestamp = this._parseTimestamp(line);
            if (!timestamp) {
                return null;
            }

            const suitableParser = this.parsers.find(p => p.canParse(line));

            if (suitableParser) {
                return suitableParser.parse(line, timestamp, this.gameType);
            }

            this.logger.debug(`[LogParserService] Unsupported log line: ${line}`);
            return null;

        } catch (err) {
            this.logger.error(`[LogParserService] Error parsing line: ${line}`, err);
            return null;
        }
    }


    private _parseTimestamp(logLine: string): Date | null {
        const regex = /\[(\d{4})\.(\d{2})\.(\d{2})-(\d{2})\.(\d{2})\.(\d{2}):(\d{3})\]/;
        const match = logLine.match(regex);

        if (match) {
            const [
                ,
                year,
                month,
                day,
                hours,
                minutes,
                seconds,
                milliseconds,
            ] = match;

            const isoTimestamp = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}Z`;

            return new Date(isoTimestamp);
        }

        return null;
    }

}