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
import { EmptyState } from './EmptyState';
import { ErrorBanner } from './ErrorBanner';
import { FullscreenButton } from './FullscreenButton';
import { Loader } from './Loader';

interface Props {
  snapshot: BridgeSnapshot;
  loading: boolean;
  error: string | null;
  emptyResult: boolean;
  isFillHeight: boolean;
  isFullscreen: boolean;
  canRequestFullscreen: boolean;
  requestFullscreen: () => void;
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
  emptyResult,
  isFillHeight,
  isFullscreen,
  canRequestFullscreen,
  requestFullscreen,
  chartAttachment,
  crossDatasetGridAttachment,
  pythonCode,
  chartTransformOption,
}: Props) {
  const closePanel = useConversationViewSidePanelOptional()?.closePanel;

  useEffect(() => {
    if (!isFullscreen) closePanel?.();
  }, [isFullscreen, closePanel]);

  const hasData = !!crossDatasetGridAttachment;
  const showLoader = loading && !hasData;
  const showEmptyState = !showLoader && !hasData && !error && emptyResult;

  useEffect(() => {
    if (showEmptyState) {
      document.documentElement.dataset.emptyState = 'true';
    } else {
      delete document.documentElement.dataset.emptyState;
    }
    return () => {
      delete document.documentElement.dataset.emptyState;
    };
  }, [showEmptyState]);

  if (snapshot.phase !== 'ready' && snapshot.phase !== 'tool-pending') {
    return (
      <ConnectionStatus phase={snapshot.phase} lastError={snapshot.lastError} />
    );
  }

  function renderContent() {
    if (showLoader) {
      return (
        <div className="flex flex-1 items-center justify-center">
          <Loader />
        </div>
      );
    }

    if (showEmptyState) {
      return (
        <div className="flex items-center justify-center py-6">
          <EmptyState message="No data found for this query. Try rephrasing your question." />
        </div>
      );
    }

    return (
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
    );
  }

  return (
    <div
      className={classNames('relative flex flex-col', {
        'm-4': !isFullscreen,
        'h-full': isFillHeight,
        'min-h-[var(--mcp-widget-min-height)]': !isFillHeight && showLoader,
      })}
    >
      {canRequestFullscreen &&
        !isFullscreen &&
        !showLoader &&
        !showEmptyState && (
          <FullscreenButton onRequestFullscreen={requestFullscreen} />
        )}

      {error && <ErrorBanner message={error} />}

      {renderContent()}
    </div>
  );
}
