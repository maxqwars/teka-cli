import { Modules, Types, Constants } from "@maxqwars/metaform";
import { mkdirSync, access, createWriteStream } from "node:fs";
import DebugTools from "../DebugTools";
import { exec } from "node:child_process";
import { join } from "node:path";
import fetch from "cross-fetch";
import os from "node:os";
import https from "https";

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
    ],
  };

  static _fetchReleaseRequiredFields: Types.ISelectQueryParams = {
    filter: ["description", "player"].concat(
      TekaModel._onlyRequiredFields.filter || []
    ),
  };

  private _databaseModule: Modules.MetaDatabase;
  private _searchModule: Modules.Search;

  private workDir = join(os.homedir(), "teka-cli");
  private mediaDir = join(this.workDir, "media");

  constructor(config?: Types.MetaModuleOptions) {
    const sharedConfig = config ? config : TekaModel.defaultModulesConfig;
    this._databaseModule = new Modules.MetaDatabase(sharedConfig);
    this._searchModule = new Modules.Search(sharedConfig);
  }

  private async deploy() {
    await this.makeDirectory(this.workDir);
    await this.makeDirectory(this.mediaDir);
  }

  async fetchReleaseData(id: number) {
    try {
      const data = await this._databaseModule.getTitle({
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
      const result = await this._databaseModule.getUpdates({
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
      const result = await this._searchModule.searchTitles({
        search: query,
        limit: 100,
        ...TekaModel._onlyRequiredFields,
      });
      return result.content;
    } catch (e) {
      return null;
    }
  }

  private async _checkApiConnection() {
    try {
      await fetch("https://api.anilibria.tv/");
      return true;
    } catch (e) {
      return false;
    }
  }

  private async _checkFFmpegInstallation(): Promise<boolean> {
    return new Promise((resolve) => {
      exec("ffmpeg -h", (error) => {
        resolve(!error);
      });
    });
  }

  async doctor() {
    const ffmpegInstalled = await this._checkFFmpegInstallation();
    const connectionBlocked = await this._checkApiConnection();
    const isDevelopmentBuild = process.env.NODE_ENV !== "development" || true;

    return {
      ffmpegInstalled,
      connectionBlocked,
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
    return new Promise((resolve, reject) => {
      try {
        const file = createWriteStream(path);
        https.get(url, (res) => {
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
        `ffmpeg -threads ${os.cpus().length} -i ${url} -c copy -bsf:a aac_adtstoasc episode-${index}.mp4`,
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

    DebugTools.debugLog(`CPU_THREADS_COUNT ${os.cpus().length}`)

    await this.deploy();

    if (!(await this._checkFFmpegInstallation())) {
      throw Error('Failed run "download", ffmpeg not installed!');
    }

    const { content } = await this._databaseModule.getTitle({
      id,
      filter: ["player", "code", "posters"],
    });

    if (content) {
      const releaseMediaDir = await this.makeDirectory(
        join(this.mediaDir, String(content.code))
      );

      // Download poster
      await this.wget(
        `https://anilibria.tv${content.posters.original.url}`,
        join(releaseMediaDir, "poster.jpg")
      );

      const downloadsList = this.generateDownloadsList(content, quality);
      const downloadsCount = downloadsList.length;

      process.chdir(releaseMediaDir);
      DebugTools.debugLog(`Work dir changed to ${releaseMediaDir}`)
      
      // Start downloading
      for (let i = 0; i < downloadsCount; i++) {
        const url = downloadsList[i];
        this.downloadMedia(url, i + 1);
        DebugTools.debugLog(
          `Episode ${i + 1}/${downloadsCount} download started... `
        );
      }

      return;
    }
  }
}
