import Table from "cli-table3";
import {
  yellow,
  green,
  red,
  gray,
  bgRed,
  yellowBright,
  greenBright,
  redBright,
} from "colorette";

export type ReleasesListViewModel = {
  id: number;
  year: number;
  typeCode: number;
  statusCode: number;
  inFavorites: number;
  name: string;
};

export type ReleaseViewModel = ReleasesListViewModel & {
  alternativePlayer: string | null;
  description: string;
};

export type DoctorReportViewModel = {
  ffmpegInstalled: boolean;
  APIConnection: boolean;
};

export default class TekaView {
  private _terminalColCount = process.stdout.columns;

  private _decodeStatusCode(code: number) {
    switch (code) {
      default: {
        return "Unknown";
      }
      case 1: {
        return yellow("P");
      }
      case 2: {
        return green("C");
      }
      case 3: {
        return red("H");
      }
      case 4: {
        return gray("N");
      }
    }
  }

  private _decodeTypeCode(code: number) {
    switch (code) {
      default: {
        return "Unknown";
      }
      case 0: {
        return "MOVIE";
      }
      case 1: {
        return "TV";
      }
      case 2: {
        return "OVA";
      }
      case 3: {
        return "ONA";
      }
      case 4: {
        return "SPECIAL";
      }
    }
  }

  private errorMessage(message: string) {
    console.log(redBright(message));
  }

  private _qualityDecode(count: number) {
    if (count > 1000) {
      return Math.round((count as number) / 1000) + "K";
    }

    return count;
  }

  displayErrorMessage(category = "SYS", message = "Unknown error") {
    console.log(`${bgRed(category)}: ${red(message)}`);
    return;
  }

  generateReleaseViewCard(viewData: ReleaseViewModel) {
    const table = new Table();

    table.push(
      { ID: viewData.id },
      { NAMES: viewData.name },
      { STATUS: this._decodeStatusCode(viewData.statusCode) },
      { TYPE: this._decodeTypeCode(viewData.typeCode) },
      { FAVORITES: this._qualityDecode(viewData.inFavorites) },
      { "WEB PLAYER": viewData.alternativePlayer },
      { DESCRIPTION: viewData.description }
    );

    return table.toString();
  }

  generateReleaseListView(viewData: ReleasesListViewModel[]) {
    const minSize = 36;
    const nameAllowedSize = this._terminalColCount - minSize;

    const table = new Table({
      head: ["ID", "YEAR", "TYPE", "S", "POP", "NAME"],
      colWidths: [7, 6, 7, 3, 6, nameAllowedSize],
    });

    viewData.map(({ id, year, typeCode, statusCode, name, inFavorites }) => {
      table.push([
        id,
        year,
        this._decodeTypeCode(typeCode),
        this._decodeStatusCode(statusCode),
        this._qualityDecode(inFavorites),
        name,
      ]);
    });

    return table.toString();
  }

  doctorReportView(viewModel: DoctorReportViewModel) {
    const table = new Table();

    table.push(
      {
        FFmpeg: viewModel.ffmpegInstalled
          ? greenBright("FFmpeg installed, command `download` available")
          : yellowBright("FFmpeg not found, command `download` unavailable"),
      },
      {
        Roskomnadzor: viewModel.APIConnection
          ? greenBright("Connection to the API server is available")
          : red("Unable to connect to the API server, please use a VPN"),
      }
    );

    return table.toString();
  }
}
