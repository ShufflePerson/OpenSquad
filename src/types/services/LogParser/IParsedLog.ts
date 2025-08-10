import { EEventType } from "types/enums/EEventType";
import { EGameType } from "types/enums/EGameType";

export interface IParsedLogBase {
    timestamp: Date;
    game: EGameType;
};

export interface IEventTakeDamage extends IParsedLogBase {
    type: EEventType.TAKE_DAMAGE,
    data: {
        damage: number;
        instigator?: string;
        weapon?: string;
        damaged?: string;
        healthRemaining?: number;
        damageType?: string;
    }
};

export type IParsedLog = IEventTakeDamage;