import classNames from 'classnames';
import type { EmptyStateTab } from '../bridge/emptyState';
import type { DataSetChoice, DimensionValueInfo } from '../bridge/types';
import { DataGrid, type DataGridColumn } from './DataGrid';
import { Tabs, type TabItem } from './Tabs';

const DATASET_COLUMNS: DataGridColumn<DataSetChoice>[] = [
  { field: 'id', headerName: 'Id' },
  { field: 'name', headerName: 'Name' },
  {
    field: 'description',
    headerName: 'Description',
    valueFormatter: (value) => (value as string | undefined) ?? '—',
  },
  {
    field: 'isOfficial',
    headerName: 'Official',
    valueFormatter: (value) => (value ? 'Yes' : 'No'),
  },
];

const DIMENSION_VALUE_COLUMNS: DataGridColumn<DimensionValueInfo>[] = [
  { field: 'id', headerName: 'Id' },
  { field: 'name', headerName: 'Name' },
  {
    field: 'description',
    headerName: 'Description',
    valueFormatter: (value) => (value as string | undefined) ?? '—',
  },
];

interface Props {
  tabs: EmptyStateTab[];
  /** Expands to fill its container's height (fullscreen/pip), matching `DataView`'s `fillHeight`. */
  fillHeight?: boolean;
}

/**
 * Renders the tabbed grids for an empty state's candidate datasets and/or
 * missing-dimension values — one `Tabs` item per entry in `tabs`, each
 * backed by a `DataGrid` with columns chosen by the tab's `kind`.
 *
 * @param tabs - Tab data built by `buildEmptyStateTabs`.
 * @param fillHeight - Threaded through to `Tabs`/`DataGrid` so the grid
 * expands to fill available height when the widget is in fullscreen/pip.
 */
export function EmptyStateTabs({ tabs, fillHeight }: Props) {
  if (tabs.length === 0) return null;

  const items: TabItem[] = tabs.map((tab) => ({
    id: tab.id,
    label: tab.label,
    content:
      tab.kind === 'datasets' ? (
        <DataGrid
          columns={DATASET_COLUMNS}
          rows={tab.datasets}
          getRowId={(row) => row.id}
          fillHeight={fillHeight}
        />
      ) : (
        <DataGrid
          columns={DIMENSION_VALUE_COLUMNS}
          rows={tab.values}
          getRowId={(row) => row.id}
          fillHeight={fillHeight}
        />
      ),
  }));

  return (
    <div className={classNames({ 'flex-1 min-h-0': fillHeight })}>
      <Tabs items={items} fillHeight={fillHeight} />
    </div>
  );
}
