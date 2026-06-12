import { useMemo } from "react";
import { useSdmxData } from "./hooks/useSdmxData";
import { buildChartOption } from "./chart/buildOption";
import { Centered } from "./components/Centered";
import { Chart } from "./components/Chart";
import { ConnectionStatus } from "./components/ConnectionStatus";
import { DataTable } from "./components/DataTable";
import { ExplorerHeader } from "./components/ExplorerHeader";
import { Loader } from "@epam/statgpt-ui-components";

export default function App() {
  const { snapshot, meta, model, loading, error, canFetch, refresh } = useSdmxData();

  const option = useMemo(
    () => (model && model.periods.length ? buildChartOption(model, meta) : null),
    [model, meta],
  );

  if (snapshot.phase !== "ready") {
    return <ConnectionStatus phase={snapshot.phase} lastError={snapshot.lastError} />;
  }

  return (
    <div
      className={
        "mx-auto flex min-h-full max-w-5xl flex-col gap-4 p-4 " +
        (snapshot.superseded ? "pointer-events-none opacity-50" : "")
      }
    >
      {snapshot.superseded && (
        <div className="rounded border border-semantic-warning bg-semantic-warning-light px-3 py-2 text-sm font-medium text-neutrals-900">
          Superseded — a newer chart instance has replaced this one.
        </div>
      )}

      <ExplorerHeader meta={meta} loading={loading} canRefresh={canFetch} onRefresh={refresh} />

      {error && (
        <div className="rounded border border-semantic-error bg-semantic-error-light px-3 py-2 text-sm text-semantic-error">
          {error}
        </div>
      )}

      <section className="rounded-lg border border-neutrals-500 bg-white p-3">
        {loading && !option ? (
          <Centered>
            <Loader />
          </Centered>
        ) : option ? (
          <Chart option={option} />
        ) : (
          <p className="py-12 text-center text-sm text-neutrals-700">No data to display.</p>
        )}
      </section>

      {model && model.periods.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutrals-700">
            Data
          </h2>
          <DataTable model={model} unit={meta?.unit} />
        </section>
      )}
    </div>
  );
}
