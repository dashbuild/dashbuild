import {html} from "npm:htl";
import {Inputs} from "npm:@observablehq/inputs";

export function dataTable(data, columns, {sortable = true, pageSize = 25} = {}) {
  return Inputs.table(data, {
    columns: columns.map((c) => c.key),
    header: Object.fromEntries(columns.map((c) => [c.key, c.label])),
    format: Object.fromEntries(
      columns
        .filter((c) => c.format)
        .map((c) => [c.key, c.format])
    ),
    sort: sortable ? columns[0]?.key : undefined,
    rows: pageSize
  });
}
