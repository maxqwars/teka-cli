import Table from "cli-table3";
import decodeStatusCode from "../utils/decodeStatusCode";
import decodeTypeCode from "../utils/decodeTypeCode";
import qualityDecode from "../utils/qualityDecode";

export type ReleaseTableViewData = {
  id: number;
  year: number;
  type: number;
  status: number;
  quality: number;
  name: string;
};

class TekaView {
  private terminalWidth = process.stdout.columns;

  makeReleasesTable(releases: ReleaseTableViewData[]) {
    const minSize = 36;
    const nameAllowedSize = this.terminalWidth - minSize;

    const releasesTable = new Table({
      head: ["ID", "YEAR", "TYPE", "S", "FAV", "NAME"],
      colWidths: [7, 6, 7, 3, 6, nameAllowedSize],
    });

    releases.map(({ id, year, type, status, name, quality }) => {
      releasesTable.push([
        id,
        year,
        decodeTypeCode(type),
        decodeStatusCode(status),
        qualityDecode(quality),
        name,
      ]);
    });

    return releasesTable.toString();
  }
}

export default new TekaView();
