#! /usr/bin/env node
import yargs from "yargs";
import fetch from "cross-fetch";
import { hideBin } from "yargs/helpers";
import { updatesCmdHandler, searchCmdHandler } from "./core/TekaController";

global.fetch = fetch;

yargs(hideBin(process.argv))
  .command("updates", "fetch updates", updatesCmdHandler)
  .command(
    "search [query]",
    "Search release",
    (yargs) => {
      return yargs.positional("query", {
        describe: "Search query",
      });
    },
    (argv) => searchCmdHandler(argv.query)
  )
  .parse();
