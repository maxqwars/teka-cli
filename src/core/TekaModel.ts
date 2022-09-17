import { Modules, Types, Constants } from "@maxqwars/metaform";
import { mkdirSync, access, createWriteStream } from "node:fs";
import DebugTools from "../DebugTools";
import { exec } from "node:child_process";
import { join } from "node:path";
import fetch from "cross-fetch";
import os from "node:os";
import https from "https";
import { SocksProxyAgent } from "socks-proxy-agent";
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

  private usrVideosDir = join(os.homedir(), "videos", "Teka");

  constructor(config?: Types.MetaModuleOptions) {
    const sharedConfig = config ? config : TekaModel.defaultModulesConfig;
    this.metaDatabaseModule = new Modules.MetaDatabase(sharedConfig);
    this.metaSearchModule = new Modules.Search(sharedConfig);
    this.tekaConfigModel = new TekaConfigModel();
  }

  async init() {
    await this.makeDirectory(this.usrVideosDir);
    console.log(await this.tekaConfigModel.get());
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

  private async wget(url, path) {
    const connectInfo = "socks://127.0.0.1:9150";
    const agent = new SocksProxyAgent(connectInfo);

    return new Promise((resolve, reject) => {
      try {
        const file = createWriteStream(path);
        https.get(url, { agent }, (res) => {
          res.pipe(file);
          file.on("finish", () => {
            file.close();
            resolve(true);
          });
        });
      } catch (e) {
        reject(e);
      }
    });
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

  async download(id: number, quality: string) {
    // Show development info
    DebugTools.debugLog(`CPU_THREADS_COUNT ${os.cpus().length}`);
    DebugTools.debugLog(`USR_VIDEOS_DIR_PATH ${this.usrVideosDir}`);

    // Abort execution if FFmpeg not installed
    if (!(await this.ffmpegIsInstalled())) {
      throw Error('Failed run "download", ffmpeg not installed!');
    }

    // Fetch data from API
    const { content } = await this.metaDatabaseModule.getTitle({
      id,
      filter: ["player", "code", "posters"],
    });

    //
    if (content) {
      const releaseMediaDir = await this.makeDirectory(
        join(this.usrVideosDir, String(content.code))
      );

      // Download poster
      await this.wget(
        `https://anilibria.tv${content.posters.original.url}`,
        join(releaseMediaDir, "poster.jpg")
      );

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

      return true;
    }
  }
}
