import { useMemo } from 'react';
import classNames from 'classnames';
import { ModuleRegistry, ClientSideRowModelModule } from 'ag-grid-community';
import type { ColDef, ValueFormatterParams } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';

ModuleRegistry.registerModules([ClientSideRowModelModule]);

export interface DataGridColumn<T> {
  field: keyof T & string;
  headerName: string;
  valueFormatter?: (value: T[keyof T]) => string;
}

interface Props<T> {
  columns: DataGridColumn<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  /** Expands the grid to fill its container's height (fullscreen/pip), matching `DataView`'s `fillHeight`. */
  fillHeight?: boolean;
}

/**
 * Row/header sizing and per-column flex width mirror `@epam/statgpt-conversation-view`'s
 * `CrossDatasetGridAttachment`/`GridContainer` grid so this grid looks and
 * behaves identically. These are not exported from that package, so the
 * values are duplicated here rather than imported.
 */
const GRID_HEADER_HEIGHT = 32;
const GRID_ROW_HEIGHT = 32;
const GRID_HORIZONTAL_SCROLL_GAP = 16;
const DEFAULT_GRID_COLUMN_WIDTH = 200;
const DEFAULT_COL_DEF: ColDef = { cellDataType: false };

function getGridHeight(rowCount: number): number {
  return (
    rowCount * GRID_ROW_HEIGHT + GRID_HEADER_HEIGHT + GRID_HORIZONTAL_SCROLL_GAP
  );
}

/**
 * Thin wrapper around `AgGridReact` for rendering a plain, non-interactive
 * reference list (e.g. candidate datasets, missing-dimension values) with
 * the same `ag-theme-quartz` visual theme, sizing, and column-width
 * behavior as the app's other grids (see `global.scss` for the shared
 * color-token overrides and dark-mode fix). Not a general-purpose data
 * table — no filtering, selection, or custom cell renderers; only column
 * sort (core ag-grid behavior, no extra module needed) is available.
 *
 * @param columns - Column definitions; `field` must be a key of `T`.
 * @param rows - Row data to render.
 * @param getRowId - Produces a stable identity per row for ag-grid.
 * @param fillHeight - When true, expands to fill available height instead
 * of sizing to its row count (capped at 400px).
 */
export function DataGrid<T extends object>({
  columns,
  rows,
  getRowId,
  fillHeight,
}: Props<T>) {
  const columnDefs: ColDef<T>[] = useMemo(
    () =>
      columns.map(
        (col) =>
          ({
            field: col.field,
            headerName: col.headerName,
            sortable: true,
            flex: 1,
            minWidth: DEFAULT_GRID_COLUMN_WIDTH,
            ...(col.valueFormatter
              ? {
                  valueFormatter: (params: ValueFormatterParams<T>) =>
                    col.valueFormatter!(params.value),
                }
              : {}),
          }) as unknown as ColDef<T>,
      ),
    [columns],
  );

  return (
    <div
      className={classNames(
        'ag-theme-quartz w-full min-h-[80px]',
        fillHeight ? 'h-full' : 'max-h-[400px]',
      )}
      style={fillHeight ? undefined : { height: getGridHeight(rows.length) }}
    >
      <AgGridReact<T>
        rowData={rows}
        columnDefs={columnDefs}
        defaultColDef={DEFAULT_COL_DEF}
        headerHeight={GRID_HEADER_HEIGHT}
        rowHeight={GRID_ROW_HEIGHT}
        enableCellTextSelection
        getRowId={(params) => getRowId(params.data)}
        domLayout="normal"
      />
    </div>
  );
}
