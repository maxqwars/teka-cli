/* -------------------------------- external -------------------------------- */
import fetch from "cross-fetch";
import { SocksProxyAgent } from "socks-proxy-agent";
import {
  Modules,
  Types,
  Constants,
  Core,
  Classes,
  Functions,
} from "@maxqwars/metaform";

/* --------------------------------- NodeJS --------------------------------- */
import { exec } from "child_process";
import { join } from "path";
import { readFile, open, createWriteStream, mkdirSync, access } from "fs";
import os from "os";
import https from "https";

/* -------------------------------- teka-cli -------------------------------- */
import { TekaConfig } from "../types/TekaConfig";
import DebugTools from "../DebugTools";
import TekaConfigModel from "../models/TekaConfigModel";

global.fetch = fetch;

export default class TekaModel {
  static defaultModulesConfig: Types.MetaModuleOptions = {
    timeout: 6000,
    baseUrl: "api.anilibria.tv",
    useHttps: true,
    version: Constants.API_VERSION.V2,
  };

  static _onlyRequiredFields: Types.ISelectQueryParams = {
    filter: [
      "id",
      "in_favorites",
      "names",
      "status.code",
      "season.year",
      "type.code",
      "genres",
    ],
  };

  static _fetchReleaseRequiredFields: Types.ISelectQueryParams = {
    filter: ["description", "player"].concat(
      TekaModel._onlyRequiredFields.filter || []
    ),
  };

  private metaDatabaseModule: Modules.MetaDatabase;
  private metaSearchModule: Modules.Search;
  private tekaConfigModel: TekaConfigModel;
  private appConfig: TekaConfig;

  private usrVideosDir = join(os.homedir(), "videos", "Teka");

  constructor(config?: Types.MetaModuleOptions) {
    const sharedConfig = config ? config : TekaModel.defaultModulesConfig;
    this.metaDatabaseModule = new Modules.MetaDatabase(sharedConfig);
    this.metaSearchModule = new Modules.Search(sharedConfig);
    this.tekaConfigModel = new TekaConfigModel();
  }

  async init() {
    this.appConfig = await this.tekaConfigModel.get();
    await this.makeDirectory(this.usrVideosDir);
  }

  async fetchReleaseData(id: number) {
    try {
      const data = await this.metaDatabaseModule.getTitle({
        id,
        ...TekaModel._fetchReleaseRequiredFields,
      });
      return data;
    } catch (e) {
      return null;
    }
  }

  async getUpdates(limit) {
    try {
      const result = await this.metaDatabaseModule.getUpdates({
        limit,
        ...TekaModel._onlyRequiredFields,
      });

      return result.content;
    } catch (e) {
      return null;
    }
  }

  async findRelease(query: string) {
    try {
      const result = await this.metaSearchModule.searchTitles({
        search: query,
        limit: 100,
        ...TekaModel._onlyRequiredFields,
      });
      return result.content;
    } catch (e) {
      return null;
    }
  }

  async doctor() {
    const ffmpegInstalled = await this.ffmpegIsInstalled();
    const apiIsAvailable = await this.theApiHostIsAvailable();
    const isDevelopmentBuild = process.env.NODE_ENV === "development" || false;
    return {
      ffmpegInstalled,
      apiIsAvailable,
      isDevelopmentBuild,
    };
  }

  private generateDownloadsList(title: Types.Title, quality: string) {
    const host = `https://${title.player.host}`;
    const result = [];

    const selectQuality = (list: {
      sd?: string;
      hd?: string;
      fhd?: string;
    }) => {
      switch (quality.toLowerCase()) {
        default: {
          return null;
        }
        case "sd": {
          return list.sd;
        }
        case "hd": {
          return list.hd;
        }
        case "fhd": {
          return list.fhd;
        }
      }
    };

    for (const key in title.player.playlist) {
      const { hls } = title.player.playlist[key];
      const file = selectQuality(hls);

      result.push(`${host}${file}`);
    }

    return result;
  }

  async download(id: number, quality: string) {
    if (!this.appConfig) return null;

    let content = null;

    DebugTools.debugLog(`CPU-THREADS-COUNT ${os.cpus().length}`);
    DebugTools.debugLog(`USR-VIDEOS-PATH ${this.usrVideosDir}`);

    // Abort execution if FFmpeg not installed
    if (!(await this.ffmpegIsInstalled())) {
      DebugTools.fail("FFmpeg not installed, abort download command");
      throw Error('Failed run "download", ffmpeg not installed!');
    }

    DebugTools.success(
      "FFmpeg installed on local machine, continue execute download"
    );

    const releaseMediaDir = await this.makeDirectory(
      join(this.usrVideosDir, String(id))
    );

    const localDataExist = await new Promise((resolve) => {
      open(join(releaseMediaDir, "release.json"), "wx", (err) => {
        if (err) {
          if (err.code === "EEXIST") {
            resolve(false);
          }
        }

        resolve(true);
      });
    });

    if (!localDataExist) {
      DebugTools.debugLog("Local release file found");
      const data = (await this.loadReleaseFromFs(
        join(releaseMediaDir, "release.json")
      )) as Types.RawTitle;
      content = Functions.TitleParser(data);
    } else {
      DebugTools.debugLog("Local release file not found");
      const urlBuilder = new Core.RequestURLBuilder(
        this.appConfig["api-server"], // Teka config `api-server`
        Constants.API_VERSION.V2 // Set API version
      );

      // Build query string
      const queryString = new Classes.GetTitleQueryBuilder()
        .setId(id)
        .setFilter(["player", "posters", "code"]) // Remove all fields
        .build();

      const url = urlBuilder
        .setQueryParams(queryString)
        .setEndpoint(Constants.API_ENDPOINTS.GET_TITLE)
        .build();

      DebugTools.debugLog(`DOWNLOAD_REQ_URL: ${url}`);

      content = Functions.TitleParser(await this.get(url));
    }

    // const data = (await this.loadReleaseFromFs(
    //   join(releaseMediaDir, "release.json")
    // )) as Types.RawTitle;
    // const content = Functions.TitleParser(data);

    // const urlBuilder = new Core.RequestURLBuilder(
    //   this.appConfig["api-server"], // Teka config `api-server`
    //   Constants.API_VERSION.V2 // Set API version
    // );

    // // Build query string
    // const queryString = new Classes.GetTitleQueryBuilder()
    //   .setId(id)
    //   .setFilter(["player", "posters", "code"]) // Remove all fields
    //   .build();

    // const url = urlBuilder
    //   .setQueryParams(queryString)
    //   .setEndpoint(Constants.API_ENDPOINTS.GET_TITLE)
    //   .build();

    // DebugTools.debugLog(`DOWNLOAD_REQ_URL: ${url}`);

    // const content = Functions.TitleParser(await this.get(url));

    try {
      await this.wget(
        `https://anilibria.tv${content.posters.original.url}`,
        join(releaseMediaDir, "poster.jpg")
      );
    } catch (e) {
      DebugTools.fail("Failed download release poster");
    }

    const downloadsList = this.generateDownloadsList(content, quality);
    const downloadsCount = downloadsList.length;

    process.chdir(releaseMediaDir);
    DebugTools.debugLog(`Work dir changed to ${releaseMediaDir}`);

    // Start downloading
    for (let i = 0; i < downloadsCount; i++) {
      const url = downloadsList[i];
      this.downloadMedia(url, i + 1);
      DebugTools.debugLog(
        `Episode ${i + 1}/${downloadsCount} download started... `
      );
    }
  }

  async save(id: number) {
    const URLBuilder = new Core.RequestURLBuilder(
      this.appConfig["api-server"], // Teka config `api-server`
      Constants.API_VERSION.V2 // Set API version
    );

    const queryString = new Classes.GetTitleQueryBuilder().setId(id).build();

    const url = URLBuilder.setQueryParams(queryString)
      .setEndpoint(Constants.API_ENDPOINTS.GET_TITLE)
      .build();

    const releaseMediaDir = await this.makeDirectory(
      join(this.usrVideosDir, String(id))
    );

    await this.wget(url, join(releaseMediaDir, "release.json"));
  }

  /* -------------------------------------------------------------------------- */
  /*                                   Inside                                   */
  /* -------------------------------------------------------------------------- */

  private async loadReleaseFromFs(path): Promise<TekaConfig | never> {
    DebugTools.debugLog("Read teka config..");
    return new Promise((resolve, reject) => {
      readFile(path, "utf8", (err, data) => {
        if (err) reject(err);
        try {
          const conf = JSON.parse(data.toString());
          DebugTools.success("Read and parse teka config");
          resolve(conf);
        } catch (e) {
          DebugTools.fail("Read or parse teka config");
          reject(e);
        }
      });
    });
  }

  private async get(url) {
    return new Promise((resolve, reject) =>
      https.get(
        url,
        {
          agent: this.appConfig["use-proxy"] ? this.createProxyAgent() : null,
          // ...options,
        },
        (response) => {
          let body = "";

          response.on("data", (chunk) => {
            body += chunk;
          });

          response.on("end", () => {
            DebugTools.debugLog(body);

            try {
              const data = JSON.parse(body);
              resolve(data);
            } catch (e) {
              reject(e);
            }
          });
        }
      )
    );
  }

  private async downloadMedia(url, index) {
    return new Promise((resolve, reject) => {
      exec(
        `ffmpeg -threads ${
          os.cpus().length
        } -i ${url} -c copy -bsf:a aac_adtstoasc episode-${index}.mp4`,
        (err) => {
          if (err) {
            reject(err);
          }
          resolve(true);
        }
      );
    });
  }

  private createProxyAgent() {
    const connectInfo = this.appConfig["proxy-conn-string"];
    return new SocksProxyAgent(connectInfo);
  }

  private async wget(url, path) {
    if (!this.appConfig) return null;

    return new Promise((resolve, reject) => {
      try {
        const file = createWriteStream(path);
        https.get(
          url,
          {
            agent: this.appConfig["use-proxy"] ? this.createProxyAgent() : null,
          },
          (res) => {
            res.pipe(file);
            file.on("finish", () => {
              file.close();
              resolve(true);
            });
          }
        );
      } catch (e) {
        reject(e);
      }
    });
  }

  private async makeDirectory(path: string) {
    async function exist(path: string) {
      return new Promise((resolve) => {
        access(path, (err) => {
          if (err) {
            resolve(false);
          } else {
            resolve(true);
          }
        });
      });
    }

    const dirIsExist = await exist(path);

    DebugTools.debugLog(`DIR ${path} is exist ${!!dirIsExist}`);

    if (dirIsExist) return path;

    try {
      mkdirSync(path);
      return path;
    } catch (e) {
      return path;
    }
  }

  private async theApiHostIsAvailable() {
    try {
      await fetch("https://api.anilibria.tv/");
      return true;
    } catch (e) {
      return false;
    }
  }

  private async ffmpegIsInstalled(): Promise<boolean> {
    return new Promise((resolve) => {
      exec("ffmpeg -h", (error) => {
        resolve(!error);
      });
    });
  }
}
