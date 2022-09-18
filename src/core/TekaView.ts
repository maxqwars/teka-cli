import Table from "cli-table3";
import {
  yellow,
  green,
  red,
  gray,
  bgRed,
  yellowBright,
  greenBright,
  magenta,
  blue,
  cyan,
  magentaBright
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
  description: string;
  genres: string[];
};

export type DoctorReportViewModel = {
  ffmpegInstalled: boolean;
  apiIsAvailable: boolean;
  isDevelopmentBuild: boolean;
};

export default class TekaView {
  private _terminalColCount = process.stdout.columns;

  private statusCodeToString(code: number, short) {
    const fullDictionary = [
      "?",
      yellow("At work"),
      green("The voiceover is complete"),
      red("Hidden"),
      gray("Not ongoing"),
    ];
    const shortDictionary = ["?", yellow("P"), green("C"), red("H"), gray("N")];

    if (!short) {
      return shortDictionary[code];
    }

    return fullDictionary[code];
  }

  private typeToString(code: number) {
    const dictionary = ["Unknown", "Movie", "TV", "OVA", "ONA", "Special"];
    return dictionary[code];
  }

  private round(count: number) {
    if (count > 1000) {
      return Math.round((count as number) / 1000) + "K";
    }

    return count;
  }

  displayErrorMessage(category = "SYS", message = "Unknown error") {
    console.log(`${bgRed(category)}: ${red(message)}`);
    return;
  }

  titleView(viewModel: ReleaseViewModel) {
    const table = new Table();
    table.push(
      { ID: viewModel.id },
      { NAMES: viewModel.name },
      { STATUS: this.statusCodeToString(viewModel.statusCode, true) },
      { TYPE: this.typeToString(viewModel.typeCode) },
      { FAVORITES: this.round(viewModel.inFavorites) },
      { GENRES: viewModel.genres.join(", ") },
      { DESCRIPTION: viewModel.description }
    );
    return table.toString();
  }

  titlesListView(viewModel: ReleasesListViewModel[]) {
    const minSize = 36;
    const nameAllowedSize = this._terminalColCount - minSize;

    const table = new Table({
      head: ["ID", "YEAR", "TYPE", "S", "POP", "NAME"],
      colWidths: [7, 6, 7, 3, 6, nameAllowedSize],
    });

    viewModel.map(({ id, year, typeCode, statusCode, name, inFavorites }) => {
      table.push([
        id,
        year,
        this.typeToString(typeCode),
        this.statusCodeToString(statusCode, false),
        this.round(inFavorites),
        name,
      ]);
    });

    return table.toString();
  }

  doctorReportView(viewModel: DoctorReportViewModel) {
    const table = new Table();

    table.push(
      {
        "FFmpeg installed on the system": viewModel.ffmpegInstalled
          ? greenBright("FFmpeg installed, command `download` available")
          : yellowBright("FFmpeg not found, command `download` unavailable"),
      },
      {
        "API is available": viewModel.apiIsAvailable
          ? greenBright("Connection to the API server is available")
          : red("Unable to connect to the API server, please use a VPN"),
      },
      {
        "This is development build": viewModel.isDevelopmentBuild
          ? red("YES")
          : green("NO"),
      }
    );

    return table.toString();
  }
}
