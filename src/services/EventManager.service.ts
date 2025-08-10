import { singleton } from 'tsyringe';
import { EventEmitter } from 'events';
import { LoggerService } from './Logger.service';

@singleton()
export class EventManagerService {
    private readonly emitter = new EventEmitter();

    constructor(private readonly logger: LoggerService) {
        this.emitter.setMaxListeners(500);
    }

    public on(eventName: string, listener: (...args: any[]) => void): void {
        this.emitter.on(eventName, listener);
    }

    public off(eventName: string, listener: (...args: any[]) => void): void {
        this.emitter.off(eventName, listener);
    }

    public emit(eventName: string, ...args: any[]): void {
        this.logger.debug(`[EventManager] Emitting event: ${eventName}`);
        this.emitter.emit(eventName, ...args);
    }
}
