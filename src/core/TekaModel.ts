import { Modules } from "@maxqwars/metaform";
import sharedConfig from "../config/sharedConfig";

class TekaModel {
  private _search = new Modules.Search(sharedConfig);
  private _database = new Modules.MetaDatabase(sharedConfig);

  async fetchUpdatedContentList(limit = 10) {
    return await this._database.getUpdates({ limit });
  }

  async searchInDatabase(search: string) {
    return await this._search.searchTitles({ search });
  }
}

export default new TekaModel();
