import { bgGreenBright, bgRedBright, blueBright, redBright } from "colorette";

export default class DebugTools {
  static devmodeOn = process.env.NODE_ENV === "development";

  static debugLog(msg) {
    if (DebugTools.devmodeOn) console.log(`${blueBright("DEBUG")} ${msg}`);
  }

  static fail(msg) {
    if (DebugTools.devmodeOn) console.log(`${bgRedBright("FAIL")} ${msg}`);
  }

  static success(msg) {
    if (DebugTools.devmodeOn) console.log(`${bgGreenBright("SUCCESS")} ${msg}`);
  }
}
