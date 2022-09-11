import { Modules, Types, Constants } from "@maxqwars/metaform";
import fetch from "cross-fetch";
import { exec } from "node:child_process";
import os from "node:os";
import { join } from "node:path";
import { readdirSync, mkdirSync, createWriteStream } from "node:fs";
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

    this.deploy();
  }

  private deploy() {
    // Stage 1: Prepare work dir
    try {
      readdirSync(this.workDir);
    } catch (e) {
      mkdirSync(this.workDir);
    }

    // Stage 2: Prepare `media` dir
    try {
      readdirSync(this.mediaDir);
    } catch (e) {
      mkdirSync(this.mediaDir);
    }
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
    const ffmpegInstalled = await this._checkFFmpegInstallation(); // FFmpeg installed in system
    const APIConnection = await this._checkApiConnection(); // Check API connection

    return {
      ffmpegInstalled,
      APIConnection,
    };
  }

  private generateListOfStreamsToDownload(title: Types.Title, quality: string) {
    const {
      player: { host, playlist },
    } = title;

    const m3u8Host = `https://${host}`;
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

    for (const key in playlist) {
      const { hls } = playlist[key];
      const file = selectQuality(hls);

      result.push(`${m3u8Host}${file}`);
    }

    return result;
  }

  private createDirIfNotExist(path: string) {
    try {
      return mkdirSync(path);
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

  async downloadMedia(id: number, quality: string) {
    const ffmpegInstalled = await this._checkFFmpegInstallation();

    if (!ffmpegInstalled) {
      throw Error("Failed run download, ffmpeg not installed!");
    }

    const { content } = await this._databaseModule.getTitle({
      id,
      filter: ["player", "code"],
    });

    if (content) {
      //
      const releaseMediaDir = this.createDirIfNotExist(
        join(this.mediaDir, String(content.code))
      );

      //
      const m3u8Dir = this.createDirIfNotExist(
        join(releaseMediaDir as string, "m3u8")
      );

      const streamsToDownload = this.generateListOfStreamsToDownload(
        content,
        quality
      );

      const downloadsCount = streamsToDownload.length;

      for (let i = 0; i < downloadsCount; i++) {
        const url = streamsToDownload[i];
        await this.wget(url, join(m3u8Dir as string, `${i}.m3u8`));
        console.log(`Download stream [${i}/${downloadsCount - 1}]`);
      }
    }

    return;
  }
}
