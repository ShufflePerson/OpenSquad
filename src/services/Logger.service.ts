import { singleton } from "tsyringe";
import chalk from 'chalk';


export enum LogLevel {
    DEBUG,
    INFO,
    WARN,
    ERROR,
}

const logLevelMap: { [key: string]: LogLevel } = {
    'debug': LogLevel.DEBUG,
    'info': LogLevel.INFO,
    'warn': LogLevel.WARN,
    'error': LogLevel.ERROR,
};

@singleton()
export class LoggerService {
    private logLevel: LogLevel = LogLevel.INFO;

    constructor() { }

    public setLevel(level: string): void {
        this.logLevel = logLevelMap[level.toLowerCase()] ?? LogLevel.INFO;
    }


    private log(level: LogLevel, message: string, ...data: any[]): void {
        if (level < this.logLevel) {
            return;
        }

        const timestamp = new Date().toISOString();
        let coloredLogLevel: string;

        switch (level) {
            case LogLevel.DEBUG:
                coloredLogLevel = chalk.gray(`[${LogLevel[level]}]`);
                break;
            case LogLevel.INFO:
                coloredLogLevel = chalk.green(`[${LogLevel[level]}]`);
                break;
            case LogLevel.WARN:
                coloredLogLevel = chalk.yellow(`[${LogLevel[level]}]`);
                break;
            case LogLevel.ERROR:
                coloredLogLevel = chalk.red(`[${LogLevel[level]}]`);
                break;
            default:
                coloredLogLevel = `[${LogLevel[level]}]`;
                break;
        }

        const coloredTimestamp = chalk.cyan(`[${timestamp}]`);
        const logMessage = `${coloredLogLevel} ${coloredTimestamp} ${message}`;

        switch (level) {
            case LogLevel.DEBUG:
                console.debug(logMessage, ...data);
                break;
            case LogLevel.INFO:
                console.info(logMessage, ...data);
                break;
            case LogLevel.WARN:
                console.warn(logMessage, ...data);
                break;
            case LogLevel.ERROR:
                console.error(logMessage, ...data);
                break;
        }
    }



    public debug(message: string, ...data: any[]): void {
        this.log(LogLevel.DEBUG, message, ...data);
    }

    public info(message: string, ...data: any[]): void {
        this.log(LogLevel.INFO, message, ...data);
    }

    public warn(message: string, ...data: any[]): void {
        this.log(LogLevel.WARN, message, ...data);
    }

    public error(message: string, ...data: any[]): void {
        this.log(LogLevel.ERROR, message, ...data);
    }
}
