import GameClientPacket from "./GameClientPacket";
import L2Buff from "../../entities/L2Buff";

export default class AbnormalStatusUpdate extends GameClientPacket {
  // @Override
  readImpl(): boolean {
    const _id = this.readC();
    const _size = this.readH();
    for (let i = 0; i < _size; i++) {
      const buff = new L2Buff();
      buff.Id = this.readD();
      buff.SkillLevel = this.readH();
      buff.RemainingTime = this.readD();

      this.Client.BuffsList.removeById(buff.Id);
      this.Client.BuffsList.add(buff);
    }

    return true;
  }

  // @Override
  run(): void {
    // no-op
  }
}
