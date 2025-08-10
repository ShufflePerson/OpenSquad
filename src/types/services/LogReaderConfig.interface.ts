export enum LogReaderSource {
    LOCAL = "LOCAL"
};

export interface LogReaderConfig {
    source: LogReaderSource;
    path: string;
};

export const LOG_READER_CONFIG = 'LOG_READER_CONFIG';