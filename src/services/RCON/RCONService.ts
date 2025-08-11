import { inject, injectable } from "tsyringe";
import { LoggerService } from "../Logger.service";
import net from "net";
import {
    ERconPacketType,
    IRCONNetworkingOptions,
    RCON_NETWORKING_OPTIONS,
} from "@/types/services/RCON/RCONNetworking.interface";

interface IDecodedPacket {
    size: number;
    id: number;
    type: ERconPacketType;
    body: string;
}

interface IPendingCommand {
    resolve: (value: string) => void;
    reject: (reason?: any) => void;
    command: string;
}

const AUTH_PACKET_ID = 999;

@injectable()
export class RCONService {
    private connectionClient: net.Socket | null = null;
    private isConnectionReady = false;
    private connectionResolver: ((value: boolean) => void) | null = null;
    private connectionRejecter: ((reason?: any) => void) | null = null;
    private connectionTimeoutId: NodeJS.Timeout | null = null;

    private lastDataBuffer: Buffer = Buffer.alloc(0);
    private _commandId = 1;
    private _responseBody = "";
    private _commandQueue: IPendingCommand[] = [];

    private _pending:
        | {
            cmdId: number;
            sentinelId: number;
        }
        | null = null;

    constructor(
        private readonly logger: LoggerService,
        @inject(RCON_NETWORKING_OPTIONS) private readonly options: IRCONNetworkingOptions
    ) {
        this.logger.info(`RCONService configured for ${this.options.gameType}.`);
    }

    private _onNetworkPacket(data: Buffer): void {
        this.lastDataBuffer = Buffer.concat([this.lastDataBuffer, data]);

        while (this.lastDataBuffer.byteLength >= 14) {
            const packet = this._decode();
            if (!packet) break;

            if (packet.id === AUTH_PACKET_ID) {
                if (packet.type === ERconPacketType.SERVERDATA_AUTH_RESPONSE) {
                    this.logger.info("RCON authentication successful.");
                    this.isConnectionReady = true;
                    this.connectionResolver?.(true);
                    this._cleanupConnectionAttempt();
                }
                continue;
            }

            if (packet.id === -1) {
                const err = new Error("RCON authentication failed: Invalid password.");
                this.logger.error(err.message);
                this.connectionRejecter?.(err);
                this._cleanupConnectionAttempt();
                this.connectionClient?.end();
                continue;
            }

            const RESPONSE_VALUE: number | undefined = (ERconPacketType as any)
                .SERVERDATA_RESPONSE_VALUE;
            const isResponse =
                packet.type === ERconPacketType.SERVERDATA_RESPONSE ||
                (RESPONSE_VALUE !== undefined && packet.type === RESPONSE_VALUE);

            if (isResponse && this._pending) {
                if (packet.id === this._pending.sentinelId) {
                    const done = this._commandQueue.shift();
                    done?.resolve(this._responseBody);
                    this._responseBody = "";
                    this._pending = null;

                    if (this._commandQueue.length > 0) {
                        this._sendCommand(this._commandQueue[0].command);
                    }
                } else {
                    if (packet.body && packet.body.length > 0) {
                        this._responseBody += packet.body;
                    }
                }
                continue;
            }
        }
    }

    private _onNetworkConnect(): void {
        this.logger.info("TCP connection successful. Attempting RCON authentication.");
        const authPacket = this._getAuthPacket();
        this._sendPacket(authPacket);
    }

    private _onNetworkClose(hadError: boolean): void {
        this.logger.info(`RCON connection closed. Had error: ${hadError}`);
        if (this.connectionRejecter) {
            this.connectionRejecter(
                new Error("Connection closed before authentication was complete.")
            );
        }
        this._commandQueue.forEach((p) => p.reject(new Error("Connection closed.")));
        this._commandQueue = [];
        this._pending = null;
        this._cleanupConnectionAttempt();
        this.isConnectionReady = false;
        this.connectionClient = null;
    }

    private _onNetworkError(err: Error): void {
        this.logger.error("RCON connection error:", err.message);
        this.connectionRejecter?.(err);
        this._cleanupConnectionAttempt();
    }

    private _cleanupConnectionAttempt(): void {
        if (this.connectionTimeoutId) clearTimeout(this.connectionTimeoutId);
        this.connectionTimeoutId = null;
        this.connectionResolver = null;
        this.connectionRejecter = null;
    }

    private _encode(type: ERconPacketType, id: number, body: string): Buffer {
        const size = Buffer.byteLength(body) + 14;
        const buf = Buffer.alloc(size);
        buf.writeInt32LE(size - 4, 0);
        buf.writeInt32LE(id, 4);
        buf.writeInt32LE(type, 8);
        buf.write(body, 12, size - 2, "utf-8");
        buf.writeInt16LE(0, size - 2);
        return buf;
    }

    private _decode(): IDecodedPacket | null {
        if (this.lastDataBuffer.byteLength < 4) return null;

        const size = this.lastDataBuffer.readInt32LE(0);
        if (size < 10 || size > 8192) return this._onBadPacket();

        if (this.lastDataBuffer.byteLength < size + 4) return null;

        const id = this.lastDataBuffer.readInt32LE(4);
        const type = this.lastDataBuffer.readInt32LE(8);
        const body = this.lastDataBuffer.toString("utf-8", 12, size + 2);

        if (
            this.lastDataBuffer[size + 2] !== 0 ||
            this.lastDataBuffer[size + 3] !== 0
        ) {
            return this._onBadPacket();
        }

        const response: IDecodedPacket = { size, id, type, body };
        this.lastDataBuffer = this.lastDataBuffer.subarray(size + 4);
        return response;
    }

    private _onBadPacket(): null {
        this.logger.error("Bad RCON packet received. Flushing buffer.");
        this.lastDataBuffer = Buffer.alloc(0);
        return null;
    }

    private _getAuthPacket(): Buffer {
        return this._encode(
            ERconPacketType.SERVERDATA_AUTH,
            AUTH_PACKET_ID,
            this.options.password
        );
    }

    private _nextId(): number {
        this._commandId = this._commandId >= 2_000_000_000 ? 1 : this._commandId + 1;
        return this._commandId;
    }

    private _sendCommand(command: string): void {
        if (!this.isConnectionReady) {
            this.logger.error("Attempted to send a command but connection is not ready.");
            return;
        }

        const cmdId = this._nextId();
        const sentinelId = this._nextId();

        const commandPacket = this._encode(
            ERconPacketType.SERVERDATA_COMMAND,
            cmdId,
            command
        );
        this._sendPacket(commandPacket);

        const sentinelPacket = this._encode(
            ERconPacketType.SERVERDATA_COMMAND,
            sentinelId,
            ""
        );
        this._sendPacket(sentinelPacket);

        this._pending = { cmdId, sentinelId };
    }

    private _sendPacket(data: Buffer) {
        try {
            if (this.connectionClient?.writable) {
                this.connectionClient.write(data);
            } else {
                this.logger.error("Failed to write a packet: connection is not writable.");
            }
        } catch (err) {
            this.logger.error("Failed to write a packet:", err);
        }
    }

    public async connect(): Promise<boolean> {
        this.logger.info(
            `Attempting to connect to a ${this.options.gameType} RCON server at ${this.options.host}:${this.options.port}`
        );
        if (this.connectionResolver) {
            return Promise.reject(new Error("Connection attempt already in progress."));
        }

        return new Promise<boolean>((resolve, reject) => {
            this.connectionResolver = resolve;
            this.connectionRejecter = reject;

            this.connectionClient = net.createConnection({
                host: this.options.host,
                port: this.options.port,
                noDelay: true,
            });

            this.connectionTimeoutId = setTimeout(() => {
                const err = new Error(
                    "Connection and authentication timed out after 10 seconds."
                );
                this.logger.error(err.message);
                this.connectionClient?.destroy();
                this._onNetworkError(err);
            }, 10_000);

            this.connectionClient.on("connect", this._onNetworkConnect.bind(this));
            this.connectionClient.on("data", this._onNetworkPacket.bind(this));
            this.connectionClient.on("close", this._onNetworkClose.bind(this));
            this.connectionClient.on("error", this._onNetworkError.bind(this));
        });
    }

    public execute(command: string): Promise<string> {
        return new Promise((resolve, reject) => {
            if (!this.isConnectionReady) {
                return reject(new Error("RCON is not connected."));
            }
            this._commandQueue.push({ resolve, reject, command });
            if (this._commandQueue.length === 1) {
                this._sendCommand(command);
            }
        });
    }
}
