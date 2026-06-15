import { useMemo } from "react";
import {
  AdvancedViewProvider,
  AttachmentRenderer,
  ConversationViewFeatureTogglesProvider,
  ConversationViewStylesProvider,
  OnboardingProvider,
} from "@epam/statgpt-conversation-view";
import type { AttachmentsActions, ChartingData, GridData } from "@epam/statgpt-conversation-view";
import type { ColDef } from "ag-grid-community";
import { useSdmxData } from "./hooks/useSdmxData";
import { chartModelToGrid } from "./adapters/chartModelToGrid";
import { chartModelToChartingData } from "./adapters/chartModelToChartingData";
import { ConnectionStatus } from "./components/ConnectionStatus";
import { ExplorerHeader } from "./components/ExplorerHeader";

const STUB_ACTIONS = {} as AttachmentsActions;

interface GridAttachment {
  type: "custom_data_grid";
  title: string;
  grid_data?: { data: GridData[]; columns: ColDef[] };
}
interface ChartAttachment {
  type: "custom_chart";
  title: string;
  charting_data?: ChartingData;
}

export default function App() {
  const { snapshot, meta, model, loading, error, canFetch, refresh } = useSdmxData();

  const attachments = useMemo((): (GridAttachment | ChartAttachment)[] => {
    if (!model) return [];
    return [
      {
        type: "custom_data_grid",
        title: meta?.title ?? "Data",
        grid_data: chartModelToGrid(model, meta),
      },
      {
        type: "custom_chart",
        title: meta?.title ?? "Chart",
        charting_data: chartModelToChartingData(model, meta),
      },
    ];
  }, [model, meta]);

  return (
    <ConversationViewStylesProvider>
      <OnboardingProvider>
        <AdvancedViewProvider>
          <ConversationViewFeatureTogglesProvider>
            {snapshot.phase !== "ready" ? (
              <ConnectionStatus phase={snapshot.phase} lastError={snapshot.lastError} />
            ) : (
              <div className="flex flex-col gap-4 p-4">
                {snapshot.superseded && (
                  <div className="rounded border border-semantic-warning bg-semantic-warning-light px-3 py-2 text-sm font-medium text-neutrals-900">
                    Superseded — a newer instance has replaced this one.
                  </div>
                )}

                <ExplorerHeader
                  meta={meta}
                  loading={loading}
                  canRefresh={canFetch}
                  onRefresh={refresh}
                />

                {error && (
                  <div className="rounded border border-semantic-error bg-semantic-error-light px-3 py-2 text-sm text-semantic-error">
                    {error}
                  </div>
                )}

                {attachments.length > 0 && (
                  <AttachmentRenderer
                    attachments={attachments as never}
                    actions={STUB_ACTIONS}
                    isDataSetAttachments={false}
                    hideDownloadButton
                    containerClassName="pt-0"
                  />
                )}
              </div>
            )}
          </ConversationViewFeatureTogglesProvider>
        </AdvancedViewProvider>
      </OnboardingProvider>
    </ConversationViewStylesProvider>
  );
}
