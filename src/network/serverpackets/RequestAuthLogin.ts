import LoginServerPacket from "./LoginServerPacket";
import * as constants from "constants";
import NodeRSA from "node-rsa";

export default class RequestAuthLogin extends LoginServerPacket {
  static LOGIN_GG: Map<string, Uint8Array> = new Map([
    [
      "D93D53271DA5722E8B031720A31E5BC3",
      Uint8Array.from([0x7f, 0x97, 0xf0, 0x78, 0x04, 0x3c, 0xe6, 0xd6, 0x71, 0x0c, 0xf6, 0x89, 0xdd, 0x9e, 0x06, 0x70]),
    ],
    [
      "00000000000000000000000000000000",
      Uint8Array.from([0x23, 0x01, 0x00, 0x00, 0x67, 0x45, 0x00, 0x00, 0xab, 0x89, 0x00, 0x00, 0xef, 0xcd, 0x00, 0x00]),
    ],
  ]);

  write(): void {
    if (this.Client.Username.length > 14) {
      throw Error("Username is too long");
    }

    if (this.Client.Password.length > 16) {
      throw Error("Password is too long");
    }

    const loginInfo: Uint8Array = new Uint8Array(128);

    loginInfo[0x5b] = 0x24;
    for (let i = 0; i < this.Client.Username.length; i++) loginInfo[0x5e + i] = this.Client.Username.charCodeAt(i);
    for (let i = 0; i < this.Client.Password.length; i++) loginInfo[0x6c + i] = this.Client.Password.charCodeAt(i);

    const modulus: Buffer = Buffer.from(this.Client.PublicKey);
    const data: Buffer = Buffer.from(loginInfo);

    const key = new NodeRSA();
    key.setOptions({
      encryptionScheme: {
        scheme: "pkcs1",
        padding: constants.RSA_NO_PADDING,
      },
    });

    key.importKey(
      {
        e: 65537, // Uint8Array.from([1, 0, 1]), // Public exponent-value F4 = 65537.
        n: modulus, // Modulus
      },
      "components-public"
    );

    const encryptedLoginInfo: Uint8Array = key.encrypt(data, "buffer");

    this.writeC(0);
    this.writeB(encryptedLoginInfo);
    this.writeD(this.Client.SessionId);

    const query: Uint8Array = new Uint8Array(16);
    query.set(this._buffer.slice(5, 21), 0);
    const gg: string = Array.from(Array.from(query), (byte) => ("0" + (byte & 0xff).toString(16)).slice(-2)).join("");

    if (RequestAuthLogin.LOGIN_GG.has(gg)) {
      this.writeB(Uint8Array.from(RequestAuthLogin.LOGIN_GG.get(gg) ?? []));
    } else {
      // prettier-ignore
      this.writeB( Uint8Array.from([0x23, 0x01, 0x00, 0x00, 0x67, 0x45, 0x00, 0x00, 0xab, 0x89, 0x00, 0x00, 0xef, 0xcd, 0x00, 0x00]));
    }

    this.writeB(Uint8Array.from([0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00])); // footer
    this.writeB(Uint8Array.from(Array(16).fill(0)));
  }
}
