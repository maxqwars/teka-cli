import { Modules } from "@maxqwars/metaform";
import sharedConfig from "../config/sharedConfig";

class TekaModel {
  private _search = new Modules.Search(sharedConfig);
  private _database = new Modules.MetaDatabase(sharedConfig);

  async fetchUpdatedContentList(limit = 10) {
    return await this._database.getUpdates({ limit });
  }
}

export default new TekaModel();
