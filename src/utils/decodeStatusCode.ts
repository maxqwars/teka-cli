import chalk from "chalk";

export default function decodeStatusCode(code: number) {
  switch (code) {
    default: {
      return "Unknown";
    }
    case 1: {
      return chalk.yellow("P");
    }
    case 2: {
      return chalk.green("C");
    }
    case 3: {
      return chalk.red("H");
    }
    case 4: {
      return chalk.gray("N");
    }
  }
}
