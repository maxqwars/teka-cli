import TekaModel from "./TekaModel";
import TekaView, { ReleasesListViewModel } from "./TekaView";

export default class TekaController {
  private _model: TekaModel;
  private _view: TekaView;

  constructor(model: TekaModel, view: TekaView) {
    this._model = model;
    this._view = view;
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

      console.log(viewModel)

      console.log(this._view.generateReleaseListView(viewModel));
      return;
    }

    return;
  }
}
