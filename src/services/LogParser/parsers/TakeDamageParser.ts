import { injectable } from "tsyringe";
import { EEventType } from "types/enums/EEventType";
import { EGameType } from "types/enums/EGameType";
import { IEventParser } from "types/services/LogParser/IEventParser";
import { IEventTakeDamage, IParsedLog } from "types/services/LogParser/IParsedLog";


@injectable()
export class TakeDamageParser implements IEventParser {
    private readonly instigatorDamageRegex = /\[([0-9]{4}\.[0-9]{2}\.[0-9]{2}-[0-9]{2}\.[0-9]{2}\.[0-9]{2}:[0-9]{3})\]\[\s*(\d+)\]LogSquadTrace: \[DedicatedServer\]TakeDamage\(\): (\S+(?:\.\S+)?)(?: .+?)?: ([\d.]+) damage attempt by causer (.+?) instigator (.+?) with damage type (.+?) health remaining ([\d.]+)/;
    private readonly seatDamageRegex = /\[([0-9]{4}\.[0-9]{2}\.[0-9]{2}-[0-9]{2}\.[0-9]{2}\.[0-9]{2}:[0-9]{3})\]\[\s*(\d+)\]LogSquadTrace: \[DedicatedServer\]TakeDamage\(\): ASQVehicleSeat::TakeDamage\[(?:Point|Radial)Damage\] (.+?) for ([\d.]+) damage \(type=(.+?)\)/;
    private readonly componentDamageRegex = /\[([0-9]{4}\.[0-9]{2}\.[0-9]{2}-[0-9]{2}\.[0-9]{2}\.[0-9]{2}:[0-9]{3})\]\[\s*(\d+)\]LogSquadTrace: \[DedicatedServer\]TakeDamage\(\): (\S+(?:\.\S+)?)(?: .+?)?: ([\d.]+) damage attempt with damage type (.+?) health remaining ([\d.]+)/;

    public canParse(line: string): boolean {
        return this.instigatorDamageRegex.test(line) || this.seatDamageRegex.test(line) || this.componentDamageRegex.test(line);
    }

    public parse(logLine: string, timestamp: Date, game: EGameType): IParsedLog | null {
        let match: RegExpMatchArray | null;

        if ((match = logLine.match(this.instigatorDamageRegex))) {
            const [, , , damaged, damage, weapon, instigator, damageType, healthRemaining] = match;

            return {
                timestamp,
                game,
                type: EEventType.TAKE_DAMAGE,
                data: {
                    damage: parseFloat(damage),
                    damaged: damaged.trim(),
                    weapon: weapon.trim(),
                    instigator: instigator.trim(),
                    damageType: damageType.trim(),
                    healthRemaining: parseFloat(healthRemaining),
                }
            } as IEventTakeDamage;
        }

        if ((match = logLine.match(this.seatDamageRegex))) {
            const [, , , damaged, damage, damageType] = match;
            return {
                timestamp,
                game,
                type: EEventType.TAKE_DAMAGE,
                data: {
                    damage: parseFloat(damage),
                    damaged: damaged.trim(),
                    damageType: damageType.trim(),
                }
            } as IEventTakeDamage;
        }

        if ((match = logLine.match(this.componentDamageRegex))) {
            const [, , , damaged, damage, damageType, healthRemaining] = match;
            return {
                timestamp,
                game,
                type: EEventType.TAKE_DAMAGE,
                data: {
                    damage: parseFloat(damage),
                    damaged: damaged.trim(),
                    damageType: damageType.trim(),
                    healthRemaining: parseFloat(healthRemaining),
                }
            } as IEventTakeDamage;
        }

        return null;
    }
}
