import { Modules, Types, Constants } from "@maxqwars/metaform";

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

  constructor(config?: Types.MetaModuleOptions) {
    const sharedConfig = config ? config : TekaModel.defaultModulesConfig;
    this._databaseModule = new Modules.MetaDatabase(sharedConfig);
    this._searchModule = new Modules.Search(sharedConfig);
  }

  async fetchReleaseData(id: number) {
    const data = await this._databaseModule.getTitle({
      id,
      ...TekaModel._fetchReleaseRequiredFields,
    });
    return data;
  }

  async getUpdates(limit = 10) {
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
}
