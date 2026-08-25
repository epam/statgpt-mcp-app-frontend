import { useMemo } from 'react';
import classNames from 'classnames';
import type { EmptyStateTab } from '../bridge/emptyState';
import type { DataSetChoice, DimensionValueInfo } from '../bridge/types';
import type { Platform } from '../host/hostContext';
import { useActiveTab } from '../hooks/useActiveTab';
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

const getDatasetRowId = (row: DataSetChoice) => row.id;
const getDimensionValueRowId = (row: DimensionValueInfo) => row.id;

interface Props {
  tabs: EmptyStateTab[];
  /** Expands to fill its container's height (fullscreen/pip), matching `DataView`'s `fillHeight`. */
  fillHeight?: boolean;
  platform: Platform;
}

/**
 * Renders the tabbed grids for an empty state's candidate datasets and/or
 * missing-dimension values — one `Tabs` item per entry in `tabs`, each
 * backed by a `DataGrid` with columns chosen by the tab's `kind`. Active-tab
 * state comes from `useActiveTab`, called unconditionally (before the
 * `tabs.length === 0` guard) so the Rules of Hooks hold even as `tabs` goes
 * from empty to non-empty across re-renders of the same mounted instance.
 *
 * `items` is memoized on `[tabs, fillHeight]` — `tabs` is itself already a
 * stable reference from `useSdmxData`'s memoized `emptyState` unless the
 * underlying tool result changed, so this keeps each tab's `content`
 * element identity stable across unrelated re-renders, letting React skip
 * re-rendering the (possibly large) `DataGrid` for tabs whose data hasn't
 * changed.
 *
 * @param tabs - Tab data built by `buildEmptyStateTabs`.
 * @param fillHeight - Threaded through to `Tabs`/`DataGrid` so the grid
 * expands to fill available height when the widget is in fullscreen/pip.
 * @param platform - The desktop/mobile bucket derived from the host context; threaded through to `Tabs`.
 */
export function EmptyStateTabs({ tabs, fillHeight, platform }: Props) {
  const items: TabItem[] = useMemo(
    () =>
      tabs.map((tab) => ({
        id: tab.id,
        label: tab.label,
        content:
          tab.kind === 'datasets' ? (
            <DataGrid
              columns={DATASET_COLUMNS}
              rows={tab.datasets}
              getRowId={getDatasetRowId}
              fillHeight={fillHeight}
            />
          ) : (
            <DataGrid
              columns={DIMENSION_VALUE_COLUMNS}
              rows={tab.values}
              getRowId={getDimensionValueRowId}
              fillHeight={fillHeight}
            />
          ),
      })),
    [tabs, fillHeight],
  );
  const [activeId, setActiveId] = useActiveTab(items);

  if (tabs.length === 0) return null;

  return (
    <div className={classNames({ 'flex-1 min-h-0': fillHeight })}>
      <Tabs
        items={items}
        activeId={activeId}
        onSelect={setActiveId}
        fillHeight={fillHeight}
        platform={platform}
      />
    </div>
  );
}
