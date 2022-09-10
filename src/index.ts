import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import TekaModel from "./core/TekaModel";
import TekaController from "./core/TekaController";
import TekaView from "./core/TekaView";

const model = new TekaModel();
const view = new TekaView();
const controller = new TekaController(model, view);
// const cli = yargs(hideBin(process.argv));

yargs(hideBin(process.argv))
  .command(
    "get-updates [limit]",
    "-> Show a list of recent updates",
    (yargs) => yargs.positional("limit", {}),
    (argv) => {
      controller.getUpdatesCommand((argv.limit as number) || 10);
    }
  )
  .command(
    "find [query]",
    "-> Search for a release in the database",
    (yargs) => yargs.positional("query", {}),
    ({ query }) => controller.find(String(query))
  )
  .command(
    "get [id]",
    "-> Viewing information about a release by its id",
    (yargs) => yargs.positional("id", {}),
    ({ id }) => {
      controller.fetchCommand(Number(id));
    }
  )
  .command(
    "download [id] [quality]",
    "-> Downloads the m3u8 release playlist and transforms it to mp4 using FFmpeg. FFmpeg installed is required",
    (yargs) => yargs,
    ({ id, quality }) => {
      controller.downloadAction(id as number, quality as string);
    }
  )
  .command("doctor", "-> Check the system", () => controller.doctor())
  .parse();
