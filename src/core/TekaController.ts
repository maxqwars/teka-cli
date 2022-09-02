import TekaModel from "./TekaModel";
import TekaView, { ReleasesListViewModel, ReleaseViewModel } from "./TekaView";
// import chalk from "chalk";

export default class TekaController {
  private _model: TekaModel;
  private _view: TekaView;

  constructor(model: TekaModel, view: TekaView) {
    this._model = model;
    this._view = view;
  }

  async fetchCommand(id: number) {
    const { error, content } = await this._model.fetchReleaseData(id);

    function chunk(str, n) {
      const ret = [""];
      let i;
      let len;

      for (i = 0, len = str.length; i < len; i += n) {
        ret.push(str.substr(i, n));
      }

      return ret;
    }

    if (error) {
      console.log(error);
      return;
    }

    if (content) {
      const desc = chunk(content.description as string, 90).join("\n");

      const viewModel: ReleaseViewModel = {
        id: content.id || 0,
        name: `${content.names?.ru}\n${content.names?.en}`,
        year: content.season?.year || 0,
        typeCode: content.type?.code || 0,
        statusCode: content.status?.code || 0,
        inFavorites: content.inFavorites || 0,
        alternativePlayer:
          `https:${content.player?.alternativePlayer}` ||
          "Web player not available".toUpperCase(),
        description: desc,
      };

      const table = this._view.generateReleaseViewCard(viewModel);

      console.log(table);
      return;
    }

    return;
  }

  async getUpdatesCommand(limit = 10) {
    const content = await this._model.getUpdates(limit);

    if (content) {
      const viewModel: ReleasesListViewModel[] = content?.map((release) => {
        return {
          id: release.id || 0,
          year: release.season?.year || 0,
          typeCode: release.type?.code || 0,
          statusCode: release.status?.code || 0,
          name: release.names?.ru || "Unknown",
          inFavorites: release.inFavorites || 0,
        };
      });

      console.log(this._view.generateReleaseListView(viewModel));
      return;
    }

    return;
  }

  async find(query) {
    const content = await this._model.findRelease(query);

    if (content) {
      const viewModel: ReleasesListViewModel[] = content?.map((release) => {
        return {
          id: release.id || 0,
          year: release.season?.year || 0,
          typeCode: release.type?.code || 0,
          statusCode: release.status?.code || 0,
          name: release.names?.ru || "Unknown",
          inFavorites: release.inFavorites || 0,
        };
      });

      console.log(this._view.generateReleaseListView(viewModel));
      return;
    }

    return;
  }
}
