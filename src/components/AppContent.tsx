import { useEffect } from 'react';
import classNames from 'classnames';
import {
  ConversationViewSidePanelOutlet,
  useConversationViewSidePanelOptional,
} from '@epam/statgpt-conversation-view';
import type { EChartsOption } from 'echarts-for-react/src/types';
import type { BridgeSnapshot } from '../bridge/types';
import type {
  ChartAttachment,
  CrossDatasetGridAttachmentData,
} from '../types/attachments';
import { ConnectionStatus } from './ConnectionStatus';
import { DataView } from './DataView';
import { ErrorBanner } from './ErrorBanner';
import { Loader } from './Loader';

interface Props {
  snapshot: BridgeSnapshot;
  loading: boolean;
  error: string | null;
  isFillHeight: boolean;
  isFullscreen: boolean;
  chartAttachment: ChartAttachment | undefined;
  crossDatasetGridAttachment: CrossDatasetGridAttachmentData | undefined;
  pythonCode: string | undefined;
  chartTransformOption?: (
    option: EChartsOption,
    ctx: { isMobile: boolean },
  ) => EChartsOption;
}

export function AppContent({
  snapshot,
  loading,
  error,
  isFillHeight,
  isFullscreen,
  chartAttachment,
  crossDatasetGridAttachment,
  pythonCode,
  chartTransformOption,
}: Props) {
  const closePanel = useConversationViewSidePanelOptional()?.closePanel;

  useEffect(() => {
    if (!isFullscreen) closePanel?.();
  }, [isFullscreen, closePanel]);

  if (snapshot.phase !== 'ready' && snapshot.phase !== 'tool-pending') {
    return (
      <ConnectionStatus phase={snapshot.phase} lastError={snapshot.lastError} />
    );
  }

  const hasData = !!crossDatasetGridAttachment;
  const showLoader = loading && !hasData;

  return (
    <div
      className={classNames('flex flex-col', {
        'm-4': !isFullscreen,
        'h-full': isFillHeight,
        'min-h-[var(--mcp-widget-min-height)]': !isFillHeight && showLoader,
      })}
    >
      {error && <ErrorBanner message={error} />}

      {showLoader ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader />
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-row">
          <div className="min-w-0 flex-1">
            <DataView
              chartAttachment={chartAttachment}
              crossDatasetGridAttachment={crossDatasetGridAttachment}
              pythonCode={pythonCode}
              codeTheme={snapshot.hostContext?.theme}
              fillHeight={isFillHeight}
              chartTransformOption={chartTransformOption}
            />
          </div>
          {isFullscreen && (
            <div className="mcp-side-panel-host">
              <ConversationViewSidePanelOutlet scope="conversation" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
