#! /usr/bin/env node
import yargs from "yargs";
import fetch from "cross-fetch";
import { hideBin } from "yargs/helpers";
import { updatesCmdHandler } from "./core/TekaController";

global.fetch = fetch;

yargs(hideBin(process.argv))
  .command("updates", "fetch updates", updatesCmdHandler)
  .parse();
