import { singleton } from 'tsyringe';
import { EventEmitter } from 'events';
import { LoggerService } from './Logger.service';
import { IEventMap } from '@/types/IEventMap.interface';

@singleton()
export class EventManagerService {
    private readonly emitter = new EventEmitter();

    constructor(private readonly logger: LoggerService) {
        this.emitter.setMaxListeners(500);
    }

    public on<K extends keyof IEventMap>(eventName: K, listener: (payload: IEventMap[K]) => void): void {
        this.emitter.on(eventName, listener);
    }

    public off<K extends keyof IEventMap>(eventName: K, listener: (payload: IEventMap[K]) => void): void {
        this.emitter.off(eventName, listener);
    }

    public emit<K extends keyof IEventMap>(eventName: K, ...args: [IEventMap[K]]): void {
        this.logger.debug(`[EventManager] Emitting event: ${eventName}`);
        try {
            this.emitter.emit(eventName, ...args);
        } catch (err) {
            this.logger.error("An event listener has thrown an error:", err);
        }
    }
}