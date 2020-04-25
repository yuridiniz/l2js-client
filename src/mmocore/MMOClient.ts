import MMOConnection from "./MMOConnection";
import ReceivablePacket from "./ReceivablePacket";
import IPacketHandler from "./IPacketHandler";
import EventEmitter from "./EventEmitter";
import IConnection from "./IConnection";

export default abstract class MMOClient {
  private _connection!: IConnection;

  private _packetHandler!: IPacketHandler<MMOClient>;

  private _eventEmitter?: EventEmitter;

  constructor(con: IConnection, localEventEmitter? : EventEmitter) {
    this._connection = con;
    this._eventEmitter = localEventEmitter;
  }
  
  abstract encrypt(var1: Uint8Array, var2: number, var3: number): void;

  abstract decrypt(var1: Uint8Array, var2: number, var3: number): void;

  get Connection(): IConnection {
    return this._connection;
  }

  get PacketHandler(): IPacketHandler<MMOClient> {
    return this._packetHandler;
  }

  set PacketHandler(handler: IPacketHandler<MMOClient>) {
    this._packetHandler = handler;
  }

  get Event(): EventEmitter | undefined {
    return this._eventEmitter;
  }

  set Event(eventEmitter: EventEmitter | undefined) {
    this._eventEmitter = eventEmitter;
  }

  private _buffer: Uint8Array = new Uint8Array();

  process(raw: Uint8Array): void {
    let data: Uint8Array = new Uint8Array(raw);
    if (this._buffer.byteLength > 0) {
      data = new Uint8Array(raw.byteLength + this._buffer.byteLength);
      data.set(this._buffer, 0);
      data.set(raw, this._buffer.byteLength);
      this._buffer = new Uint8Array();
    }

    let i = 0;
    while (i < data.byteLength) {
      const pLen = data[i] + (data[i + 1] << 8);

      if (pLen <= 2) {
        break;
      }

      if (i + pLen > data.byteLength) {
        this._buffer = data.slice(i);
        break;
      }

      ((n, ctx) => {
        const packetData = new Uint8Array(data.slice(n + 2, n + pLen)); // +2 is for skipping the packet size
        ctx.decrypt(packetData, 0, packetData.byteLength);

        setTimeout(() => {
          const rcp: ReceivablePacket<MMOClient> = ctx._packetHandler.handlePacket(packetData, ctx);
          if (!rcp) {
            return; // We cannot find the required packet handler. Most probably the game packet is not yet implemented.
          }

          if (rcp.read()) {
            this._eventEmitter?.fire(`packet:${rcp.constructor.name}`, rcp);
            rcp.run();
          }
        }, 0);
      })(i, this);

      i += pLen;
    }
  }

  hexString(data: Uint8Array): string {
    return (
      " ".repeat(7) +
      Array.from(new Array(16), (n, v) => ("0" + (v & 0xff).toString(16)).slice(-2).toUpperCase()).join(" ") +
      "\r\n" +
      "=".repeat(54) +
      "\r\n" +
      Array.from(Array.from(data), (byte, k) => {
        return (
          (k % 16 === 0
            ? ("00000" + ((Math.ceil(k / 16) * 16) & 0xffff).toString(16)).slice(-5).toUpperCase() + "  "
            : "") +
          ("0" + (byte & 0xff).toString(16)).slice(-2) +
          ((k + 1) % 16 === 0 ? "\r\n" : " ")
        );
      })
        .join("")
        .toUpperCase() +
      "\r\n"
    );
  }
}
