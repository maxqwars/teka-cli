#! /usr/bin/env node
import yargs from "yargs";
import fetch from "cross-fetch";
import Table from "cli-table3";
import decodeStatusCode from "./utils/decodeStatusCode";
import decodeTypeCode from "./utils/decodeTypeCode";
import qualityDecode from "./utils/qualityDecode";
import tableCharacters from "./config/tableCharacters";
import chunk from "./utils/chunk";
import { Types, Constants, Modules } from "@maxqwars/metaform";
import { hideBin } from "yargs/helpers";

global.fetch = fetch;

const DEFAULT_API_URL = "api.anilibria.tv";
const DEFAULT_REQUEST_TIMEOUT = 6000;

const sharedConfig: Types.MetaModuleOptions = {
  timeout: DEFAULT_REQUEST_TIMEOUT,
  baseUrl: DEFAULT_API_URL,
  version: Constants.API_VERSION.V2,
  useHttps: false,
};

const metaDatabase = new Modules.MetaDatabase(sharedConfig);
const metaSearch = new Modules.Search(sharedConfig);

await yargs(hideBin(process.argv))
  .command(
    "fetch [id]",
    "Grab information about release",
    (yargs) => {
      return yargs.positional("id", { describe: "AniLibria release id" });
    },
    async (argv) => {
      const { content } = await metaDatabase.getTitle({
        id: argv.id as unknown as number,
      });

      const releaseInfoTable = new Table({ chars: tableCharacters });

      releaseInfoTable.push(
        { Name: content?.names?.ru },
        { Genres: content?.genres?.join(",") },
        {
          Description: chunk(content?.description as string, 25).join("\n"),
        }
      );

      console.log(releaseInfoTable.toString());
      return;
    }
  )
  .command(
    "updates",
    "Get updates",
    (yargs) => { return yargs },
    async () => {
      const { content } = await metaDatabase.getUpdates({
        filter: [
          "id",
          "names",
          "season.year",
          "status.code",
          "in_favorites",
          "type.code",
        ],
        limit: 10,
      });

      const updatesTable = new Table({
        head: ["ID", "YEAR", "TYPE", "S", "FAV", "NAME"],
        colWidths: [7, 7, 9, 3, 6, 60],
        chars: tableCharacters,
      });

      const sorted =
        content?.sort((a, b) => {
          const yearA = a.season?.year || 0;
          const yearB = b.season?.year || 0;
          if (yearA > yearB) return 1;
          if (yearA < yearB) return -1;
          return 0;
        }) || [];

      sorted?.map(({ id, names, season, status, type, inFavorites }) => {
        updatesTable.push([
          id || "N/D",
          season?.year,
          decodeTypeCode(type?.code || 0),
          decodeStatusCode(status?.code || 0),
          qualityDecode(inFavorites as number),
          names?.ru,
        ]);
      });

      console.log(updatesTable.toString());

      return;
    }
  )
  .command(
    "search [query]",
    "Search release",
    (yargs) => {
      return yargs.positional("query", {
        describe: "Search release in database",
      });
    },
    async (argv) => {
      const { query, limit } = argv;
      const { content } = await metaSearch.searchTitles({
        search: query as unknown as string,
        limit: (limit as unknown as number) || 100,
        filter: [
          "id",
          "names",
          "season.year",
          "status.code",
          "in_favorites",
          "type.code",
        ],
      });

      const searchResultsTable = new Table({
        head: ["ID", "YEAR", "TYPE", "S", "FAV", "NAME"],
        colWidths: [7, 7, 9, 3, 6, 60],
        chars: tableCharacters,
      });

      const sorted =
        content?.sort((a, b) => {
          const yearA = a.season?.year || 0;
          const yearB = b.season?.year || 0;
          if (yearA > yearB) return 1;
          if (yearA < yearB) return -1;
          return 0;
        }) || [];

      // Build results table
      sorted?.map(({ id, names, season, status, type, inFavorites }) => {
        searchResultsTable.push([
          id || "N/D",
          season?.year,
          decodeTypeCode(type?.code || 0),
          decodeStatusCode(status?.code || 0),
          qualityDecode(inFavorites as number),
          names?.ru,
        ]);
      });

      console.log(searchResultsTable.toString());
      return;
    }
  )
  .parse();
