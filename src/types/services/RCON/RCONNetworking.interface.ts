import { EGameType } from "@/types/enums/EGameType";

export enum ERconPacketType {
    SERVERDATA_AUTH = 0x03,
    SERVERDATA_COMMAND = 0x02,
    SERVERDATA_RESPONSE = 0x00,
    SERVERDATA_AUTH_RESPONSE = 0x02
}

export enum ERconPacketID {
    EMPTY_PACKET_ID = 100,
    AUTH_PACKET_ID = 101
}

export interface IRCONNetworkingOptions {
    host: string;
    port: number;
    password: string;
    gameType: EGameType;
}

export const RCON_NETWORKING_OPTIONS = "RCON_NETWORKING_OPTIONS";