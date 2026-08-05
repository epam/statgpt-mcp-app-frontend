import { render, screen } from '@testing-library/react';
import { DataGrid, type DataGridColumn } from '../DataGrid';
import { mockAgGridElementDimensions } from '../../test-utils/mockAgGridElementDimensions';

interface Row {
  id: string;
  name: string;
  description?: string;
}

const columns: DataGridColumn<Row>[] = [
  { field: 'id', headerName: 'Id' },
  { field: 'name', headerName: 'Name' },
  {
    field: 'description',
    headerName: 'Description',
    valueFormatter: (value) => (value as string | undefined) ?? '—',
  },
];

const rows: Row[] = [
  { id: 'USA', name: 'United States', description: 'North America' },
  { id: 'FRA', name: 'France' },
];

describe('DataGrid', () => {
  beforeAll(() => {
    mockAgGridElementDimensions();
  });

  it('renders a header for each column', async () => {
    render(<DataGrid columns={columns} rows={rows} getRowId={(r) => r.id} />);
    expect(await screen.findByText('Id')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
  });

  it('renders every row', async () => {
    render(<DataGrid columns={columns} rows={rows} getRowId={(r) => r.id} />);
    expect(await screen.findByText('United States')).toBeInTheDocument();
    expect(screen.getByText('France')).toBeInTheDocument();
  });

  it('renders a missing description as an em dash via valueFormatter', async () => {
    render(<DataGrid columns={columns} rows={rows} getRowId={(r) => r.id} />);
    expect(await screen.findByText('—')).toBeInTheDocument();
  });

  it('sizes its container to the row count and caps it at 400px when fillHeight is not set', async () => {
    const { container } = render(
      <DataGrid columns={columns} rows={rows} getRowId={(r) => r.id} />,
    );
    await screen.findByText('Id');
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain('max-h-[400px]');
    expect(root.className).not.toContain('h-full');
    // 2 rows * 32px row height + 32px header + 16px scroll gap = 112px
    expect(root.style.height).toBe('112px');
  });

  it('expands to fill its container and drops the row-count height when fillHeight is set', async () => {
    const { container } = render(
      <DataGrid
        columns={columns}
        rows={rows}
        getRowId={(r) => r.id}
        fillHeight
      />,
    );
    await screen.findByText('Id');
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain('h-full');
    expect(root.className).not.toContain('max-h-[400px]');
    expect(root.style.height).toBe('');
  });
});
