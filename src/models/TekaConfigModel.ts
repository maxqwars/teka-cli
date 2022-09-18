import { join } from "path";
import { readFile, writeFile } from "fs";
import { homedir } from "os";
import { TekaConfig } from "../types/TekaConfig";
import { DEFAULT_CONFIG } from "../constants/DEFAULT_CONFIG";
import DebugTools from "../DebugTools";

export default class TekaConfigModel {
  private usrHomeDir = homedir();
  private configFilePath = join(this.usrHomeDir, "teka-config.json");

  private async read(): Promise<TekaConfig | never> {
    DebugTools.debugLog("Read teka config..");
    return new Promise((resolve, reject) => {
      readFile(this.configFilePath, "utf8", (err, data) => {
        if (err) reject(err);
        try {
          const conf = JSON.parse(data.toString());
          DebugTools.success("Read and parse teka config");
          resolve(conf);
        } catch (e) {
          DebugTools.fail("Read or parse teka config");
          reject(e);
        }
      });
    });
  }

  private async write(
    config: TekaConfig = DEFAULT_CONFIG
  ): Promise<TekaConfig | never> {
    DebugTools.debugLog("Write teka config...");
    return new Promise((resolve, reject) => {
      try {
        writeFile(
          this.configFilePath,
          JSON.stringify(config, null, " "),
          "utf8",
          (err) => {
            if (err) reject(err);
            DebugTools.success("Write teka config");
            resolve(config);
          }
        );
      } catch (e) {
        reject(e);
      }
    });
  }

  async get(): Promise<TekaConfig> {
    try {
      return await this.read();
    } catch (e) {
      return await this.write();
    }
  }
}
