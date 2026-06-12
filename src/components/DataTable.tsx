import type { ChartModel } from "../sdmx/parse";

// Plain HTML table styled with the design-system tokens (Tailwind color
// names backed by colors.scss). Kept dependency-light; ag-grid parity is a
// documented follow-up.
export function DataTable({ model, unit }: { model: ChartModel; unit?: string }) {
  if (model.periods.length === 0) return null;

  return (
    <div className="overflow-auto rounded border border-neutrals-500">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-neutrals-300 text-neutrals-900">
            <th className="sticky left-0 z-10 bg-neutrals-300 px-3 py-2 text-left font-semibold">
              Period
            </th>
            {model.series.map((s) => (
              <th key={s.name} className="px-3 py-2 text-right font-semibold">
                {s.name}
                {unit ? <span className="font-normal text-neutrals-700"> ({unit})</span> : null}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {model.periods.map((period, i) => (
            <tr key={period} className="odd:bg-white even:bg-neutrals-100">
              <td className="sticky left-0 z-10 bg-inherit px-3 py-1.5 font-medium text-neutrals-900">
                {period}
              </td>
              {model.series.map((s) => (
                <td key={s.name} className="px-3 py-1.5 text-right tabular-nums text-neutrals-900">
                  {s.data[i] === null || s.data[i] === undefined ? "—" : s.data[i]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
