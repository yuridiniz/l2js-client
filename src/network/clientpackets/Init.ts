import LoginClientPacket from "./LoginClientPacket";
import AuthGameGuard from "../serverpackets/AuthGameGuard";
import NewCrypt from "../../security/crypt/NewCrypt";

export default class Init extends LoginClientPacket {
  // @Override
  readImpl(): boolean {
    const checkNum: number = new DataView(
      this._buffer.slice(this._buffer.length - 8, this._buffer.length - 4).buffer
    ).getUint32(0, true);

    NewCrypt.decXORPass(this._buffer, 0, this._buffer.length, checkNum);

    const _id: number = this.readC();
    const _sessionId = this.readD();
    const _protocolVersion = this.readD();
    const _publicKey = this.unscrambleModulus(this.readB(128));

    // unk GG related?
    const _unkn1 = this.readD();
    const _unkn2 = this.readD();
    const _unkn3 = this.readD();
    const _unkn4 = this.readD();

    const _blowfishKey = this.readB(16);

    this.Client.SessionId = _sessionId;
    this.Client.BlowfishKey = _blowfishKey;
    this.Client.PublicKey = _publicKey;
    return true;
  }

  // @Override
  run(): void {
    this.Client.sendPacket(new AuthGameGuard(this.Client.SessionId));
  }

  private unscrambleModulus(mods: Uint8Array): Uint8Array {
    for (let i = 0; i < 0x40; i++) {
      mods[0x40 + i] = mods[0x40 + i] ^ mods[i];
    }
    // step 3 : xor bytes 0x0d-0x10 with bytes 0x34-0x38
    for (let i = 0; i < 4; i++) {
      mods[0x0d + i] = mods[0x0d + i] ^ mods[0x34 + i];
    }
    // step 2 : xor first 0x40 bytes with  last 0x40 bytes
    for (let i = 0; i < 0x40; i++) {
      mods[i] = mods[i] ^ mods[0x40 + i];
    }
    // step 1 : 0x4d-0x50 <-> 0x00-0x04
    for (let i = 0; i < 4; i++) {
      const temp: number = mods[0x00 + i];
      mods[0x00 + i] = mods[0x4d + i];
      mods[0x4d + i] = temp;
    }

    return mods;
  }
}
