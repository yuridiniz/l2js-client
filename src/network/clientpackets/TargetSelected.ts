import GameClientPacket from "./GameClientPacket";

export default class TargetSelected extends GameClientPacket {
  //@Override
  readImpl(): boolean {
    let _id = this.readC();

    let _objectId = this.readD();
    let _targetObjectId = this.readD();

    let _x = this.readD();
    let _y = this.readD();
    let _z = this.readD();

    let _unkn1 = this.readD();

    return true;
  }

  //@Override
  run(): void {}
}