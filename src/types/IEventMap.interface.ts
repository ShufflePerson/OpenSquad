import { EEventType } from '@/types/enums/EEventType';
import { IEventTakeDamage } from 'types/services/LogParser/IParsedLog';

export interface IEventMap {
    [EEventType.TAKE_DAMAGE]: IEventTakeDamage;
}