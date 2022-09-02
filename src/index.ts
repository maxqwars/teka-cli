#! /usr/bin/env node
import yargs from "yargs";
import fetch from "cross-fetch";
import { hideBin } from "yargs/helpers";
import TekaModel from "./core/TekaModel";
import TekaController from "./core/TekaController";
import TekaView from "./core/TekaView";

global.fetch = fetch;

const model = new TekaModel();
const view = new TekaView();
const controller = new TekaController(model, view);
const cli = yargs(hideBin(process.argv));

// ==>
cli.command("get-updates", "=>", () => controller.getUpdatesCommand());

// ==>
cli.command(
  "find [query]",
  "=>",
  (yargs) => {
    return yargs.positional("query", {});
  },
  (argv) => controller.find(argv.query)
);

// ==>
cli.command(
  "fetch [id]",
  "=>",
  (yargs) => {
    return yargs.positional("id", {});
  },
  (argv) => {
    controller.fetchCommand(Number(argv.id));
  }
);

// ==>
cli.parse();
