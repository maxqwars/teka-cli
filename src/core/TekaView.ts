import Table from "cli-table3";
// import chalk from "chalk";

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

export default class TekaView {
  private _terminalColCount = process.stdout.columns;

  private _decodeStatusCode(code: number) {
    switch (code) {
      default: {
        return "Unknown";
      }
      case 1: {
        // return chalk.yellow("P");
        return "M"
      }
      case 2: {
        // return chalk.green("C");
        return "M"
      }
      case 3: {
        // return chalk.red("H");
        return "M"
      }
      case 4: {
        // return chalk.gray("N");
        return "M"
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

  private _qualityDecode(count: number) {
    if (count > 1000) {
      return Math.round((count as number) / 1000) + "K";
    }

    return count;
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
}
