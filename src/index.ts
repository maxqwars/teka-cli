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

yargs(hideBin(process.argv))
  .command("get-updates", "=>", () => controller.getUpdatesCommand())
  .parse();
