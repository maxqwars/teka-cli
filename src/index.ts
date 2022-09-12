import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import TekaModel from "./core/TekaModel";
import TekaController from "./core/TekaController";
import TekaView from "./core/TekaView";

const teka = new TekaController(new TekaModel(), new TekaView());

yargs(hideBin(process.argv))
  .scriptName("TEKA-CLI")
  .usage('$0 <cmd> [args]')
  .command(
    "get-updates [limit]",
    "-> Show a list of recent updates",
    (yargs) => yargs.positional("limit", {}),
    (argv) => {
      teka.getUpdates((argv.limit as number) || 10);
    }
  )
  .command(
    "find [query]",
    "-> Search for a release in the database",
    (yargs) => yargs.positional("query", {}),
    ({ query }) => teka.find(String(query))
  )
  .command(
    "get [id]",
    "-> Viewing information about a release by its id",
    (yargs) => yargs.positional("id", {}),
    ({ id }) => {
      teka.get(Number(id));
    }
  )
  .command(
    "download [id] [quality]",
    "-> Downloads the m3u8 release playlist and transforms it to mp4 using FFmpeg. (FFmpeg installed is required)",
    (yargs) => yargs,
    ({ id, quality }) => {
      teka.download(id as number, quality as string);
    }
  )
  .command("doctor", "-> Check the system", () => teka.doctor())
  .parse();
