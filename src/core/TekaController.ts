import TekaModel from "./TekaModel";
import TekaView, { ReleasesListViewModel, ReleaseViewModel } from "./TekaView";

export default class TekaController {
  private model: TekaModel;
  private view: TekaView;

  constructor(model: TekaModel, view: TekaView) {
    this.model = model;
    this.view = view;
  }

  private splitText(str, n) {
    const ret = [""];
    let i;
    let len;

    for (i = 0, len = str.length; i < len; i += n) {
      ret.push(str.substr(i, n));
    }

    return ret;
  }

  async get(id: number) {
    const data = await this.model.fetchReleaseData(id);

    // cross-fetch error
    if (data === null) {
      this.view.displayErrorMessage(
        "ACCESS_ERROR",
        "Error receiving data from API server. The API server is not available."
      );
      return;
    }

    const { error, content } = data;

    // API error
    if (error) {
      this.view.displayErrorMessage(
        "API_ERROR",
        `API error, release with specified id was not found.`
      );
      return;
    }

    if (content) {
      const desc = this.splitText(content.description as string, 90).join("\n");

      const viewModel: ReleaseViewModel = {
        id: content.id || 0,
        name: `${content.names?.ru}\n${content.names?.en}`,
        year: content.season?.year || 0,
        typeCode: content.type?.code || 0,
        statusCode: content.status?.code || 0,
        inFavorites: content.inFavorites || 0,
        description: desc,
        genres: content.genres,
      };

      return console.log(this.view.titleView(viewModel));
    }

    return;
  }

  async getUpdates(limit) {
    try {
      const content = await this.model.getUpdates(limit);

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

        console.log(this.view.titlesListView(viewModel));
        return;
      }
    } catch (e) {
      this.view.displayErrorMessage("SYS", "Failed connect to API server");
    }

    return;
  }

  async find(query) {
    const content = await this.model.findRelease(query);

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

      console.log(this.view.titlesListView(viewModel));
      return;
    }

    return;
  }

  async doctor() {
    const report = await this.model.doctor();
    return console.log(this.view.doctorReportView(report));
  }

  async download(id: number, quality = "hd") {
    const status = await this.model.download(id, quality);
    console.log(status);
    return;
  }
}
