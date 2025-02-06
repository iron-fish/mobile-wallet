import { SettingsDb } from "./db";

type StartedState = { type: "STARTED"; db: SettingsDb };
type SettingsDbState = { type: "STOPPED" } | { type: "LOADING" } | StartedState;

class SettingsManagerClass {
  private state: SettingsDbState = { type: "STOPPED" };

  private assertStarted(state: SettingsDbState): asserts state is StartedState {
    if (state.type !== "STARTED") {
      throw new Error("SettingsDb is not started");
    }
  }

  async start() {
    if (this.state.type === "STARTED") {
      return;
    }

    this.state = { type: "STARTED", db: await SettingsDb.init() };
  }

  db(): SettingsDb {
    this.assertStarted(this.state);

    return this.state.db;
  }
}

export const SettingsManager = new SettingsManagerClass();
