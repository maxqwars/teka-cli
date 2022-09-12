import { blueBright } from "colorette";

export default class DebugTools {
  static devmodeOn = process.env.NODE_ENV === "development";

  static debugLog(msg) {
    if (DebugTools.devmodeOn) console.log(`${blueBright("DEBUG")} ${msg}`);
  }
}
