import TekaModel from "./TekaModel";
import TekaView, { ReleaseTableViewData } from "./TekaView";

class TekaController {
  private static _model = TekaModel;
  private static _view = TekaView;

  static async updates() {
    const { content } = await this._model.fetchUpdatedContentList();

    if (content) {
      const viewData: ReleaseTableViewData[] = content.map((release) => {
        return {
          id: release.id || 0,
          year: release.season?.year || 0,
          type: release.type?.code || 0,
          status: release.status?.code || 0,
          name: release.names?.ru || "Unknown",
          quality: release.inFavorites || 0,
        };
      });

      console.log(this._view.makeReleasesTable(viewData));
    }
  }
}

export const updatesCmdHandler = TekaController.updates.bind(TekaController);
