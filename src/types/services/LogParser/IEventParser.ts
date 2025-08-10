import { EGameType } from "types/enums/EGameType";
import { IParsedLog } from "./IParsedLog";

export interface IEventParser {
    parse(logLine: string, timestamp: Date, game: EGameType): IParsedLog | null;
    canParse(line: string): boolean;
}

export const EVENT_PARSER = "EVENTPARSER";