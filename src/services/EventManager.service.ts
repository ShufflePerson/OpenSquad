import { singleton } from 'tsyringe';
import { EventEmitter } from 'events';
import { LoggerService } from './Logger.service';
import { IEventMap } from '@/types/IEventMap.interface';

type ListenerInfo = {
    eventName: keyof IEventMap;
    listener: (...args: any[]) => void;
};

@singleton()
export class EventManagerService {
    private readonly emitter = new EventEmitter();
    private readonly subscriptions = new Map<object, ListenerInfo[]>();

    constructor(private readonly logger: LoggerService) {
        this.emitter.setMaxListeners(500);
    }

    public on<K extends keyof IEventMap>(
        subscriber: object,
        eventName: K,
        listener: (payload: IEventMap[K]) => void
    ): void {
        if (!this.subscriptions.has(subscriber)) {
            this.subscriptions.set(subscriber, []);
        }

        this.subscriptions.get(subscriber)?.push({ eventName, listener });

        this.emitter.on(eventName, listener);
    }

    public off<K extends keyof IEventMap>(
        subscriber: object,
        eventName: K,
        listener: (payload: IEventMap[K]) => void
    ): void {
        this.emitter.off(eventName, listener);

        if (this.subscriptions.has(subscriber)) {
            const currentListeners = this.subscriptions.get(subscriber) ?? [];

            const updatedListeners = currentListeners.filter(
                info => !(info.eventName === eventName && info.listener === listener)
            );

            if (updatedListeners.length > 0) {
                this.subscriptions.set(subscriber, updatedListeners);
            } else {
                this.subscriptions.delete(subscriber);
            }
        }
    }

    public emit<K extends keyof IEventMap>(eventName: K, ...args: [IEventMap[K]]): void {
        this.logger.debug(`[EventManager] Emitting event: ${eventName}`);
        try {
            this.emitter.emit(eventName, ...args);
        } catch (err) {
            this.logger.error("An event listener has thrown an error:", err);
        }
    }

    public unsubscribeAll(subscriber: object): void {
        const subscriberListeners = this.subscriptions.get(subscriber);

        if (!subscriberListeners) {
            this.logger.debug(`[EventManager] No subscriptions found for the given instance.`);
            return;
        }

        this.logger.debug(`[EventManager] Unsubscribing all ${subscriberListeners.length} listeners for an instance.`);

        for (const { eventName, listener } of subscriberListeners) {
            this.emitter.off(eventName, listener);
        }

        this.subscriptions.delete(subscriber);
    }
}