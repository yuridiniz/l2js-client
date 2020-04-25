import MMOClient from "../mmocore/MMOClient";
import LoginCrypt from "../security/crypt/LoginCrypt";
import LoginServerPacket from "./serverpackets/LoginServerPacket";
import ServerData from "./ServerData";
import MMOConnection from "../mmocore/MMOConnection";
import LoginPacketHandler from "./LoginPacketHandler";
import MMOConfig from "../mmocore/MMOConfig";
import EventEmitter from "../mmocore/EventEmitter";

export default class LoginClient extends MMOClient {
  private _username: string;

  private _password: string;

  private _loginCrypt: LoginCrypt;

  onSuccessCallback!: () => void;

  private _sessionId: number = 0;

  private _blowfishKey!: Uint8Array;

  private _publicKey!: Uint8Array;

  private _loginOk1!: number;

  private _loginOk2!: number;

  private _playOk1!: number;

  private _playOk2!: number;

  private _servers: ServerData[] = [];

  private _selectedServer!: ServerData;

  private _serverId!: number;

  private _config!: MMOConfig;

  get ServerId(): number {
    return this._serverId;
  }

  set ServerId(serverId: number) {
    this._serverId = serverId;
  }

  get PlayOk1(): number {
    return this._playOk1;
  }

  set PlayOk1(playOk1: number) {
    this._playOk1 = playOk1;
  }

  get PlayOk2(): number {
    return this._playOk2;
  }

  set PlayOk2(playOk2: number) {
    this._playOk2 = playOk2;
  }

  get LoginOk1(): number {
    return this._loginOk1;
  }

  set LoginOk1(loginOk1: number) {
    this._loginOk1 = loginOk1;
  }

  get LoginOk2(): number {
    return this._loginOk2;
  }

  set LoginOk2(loginOk2: number) {
    this._loginOk2 = loginOk2;
  }

  get Username(): string {
    return this._username;
  }

  set Username(username: string) {
    this._username = username;
  }

  get Password(): string {
    return this._password;
  }

  set Password(password: string) {
    this._password = password;
  }

  get PublicKey(): Uint8Array {
    return this._publicKey;
  }

  set PublicKey(publicKey: Uint8Array) {
    this._publicKey = publicKey;
  }

  get SessionId(): number {
    return this._sessionId;
  }

  set SessionId(sessionId: number) {
    this._sessionId = sessionId;
  }

  get BlowfishKey(): Uint8Array {
    return this._blowfishKey;
  }

  set BlowfishKey(blowfishKey: Uint8Array) {
    this._blowfishKey = blowfishKey;
  }

  get Servers(): ServerData[] {
    return this._servers;
  }

  set Servers(servers: ServerData[]) {
    this._servers = servers;
    this._selectedServer = servers.find((s) => s.Id === this.Config.serverId) ?? servers[0];
  }

  get SelectedServer(): ServerData {
    return this._selectedServer;
  }

  set SelectedServer(server: ServerData) {
    this._selectedServer = server;
  }

  get Config(): MMOConfig {
    return this._config;
  }

  set Config(config: MMOConfig) {
    this._config = config;
  }

  constructor(config: MMOConfig, onSuccessCallback?: () => void, localEventEmitter?: EventEmitter) {
    super(new MMOConnection(config), localEventEmitter);
    this.Config = config;
    (this.Connection as MMOConnection<LoginClient>).Client = this;
    this.PacketHandler = new LoginPacketHandler();
    if (onSuccessCallback) {
      this.onSuccessCallback = onSuccessCallback;
    }

    this._username = config.username;
    this._password = config.password;
    if (config.serverId) {
      this._serverId = config.serverId;
    }
    this._loginCrypt = new LoginCrypt();
    this._loginCrypt.setKey(LoginCrypt.STATIC_BLOWFISH_KEY);
  }

  sendPacket(lsp: LoginServerPacket): void {
    lsp.write();

    this._loginCrypt.setKey(this.BlowfishKey);
    this._loginCrypt.encrypt(lsp.Buffer, 0, lsp.Position);

    const sendable: Uint8Array = new Uint8Array(lsp.Position + 2);
    sendable[0] = (lsp.Position + 2) & 0xff;
    sendable[1] = (lsp.Position + 2) >>> 8;
    sendable.set(lsp.Buffer.slice(0, lsp.Position), 2);

    this.Connection.write(sendable);
  }

  encrypt(buf: Uint8Array, offset: number, size: number): void {
    this._loginCrypt.encrypt(buf, offset, size);
  }

  decrypt(buf: Uint8Array, offset: number, size: number): void {
    this._loginCrypt.decrypt(buf, offset, size);
  }
}
