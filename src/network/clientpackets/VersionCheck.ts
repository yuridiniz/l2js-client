import GameClientPacket from "./GameClientPacket";

export default class VersionCheck extends GameClientPacket {
  //@Override
  readImpl(): boolean {
    let _id = this.readC();

    return true;
  }

  //@Override
  run(): void {
    //
  }
}