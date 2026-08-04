import { useEffect } from 'react';
import classNames from 'classnames';
import {
  ConversationViewSidePanelOutlet,
  useConversationViewSidePanelOptional,
} from '@epam/statgpt-conversation-view';
import type { EChartsOption } from 'echarts-for-react/src/types';
import type { BridgeSnapshot, WidgetMeta } from '../bridge/types';
import { EmptyStateKind, type EmptyStateContent } from '../bridge/emptyState';
import type { Platform } from '../host/hostContext';
import { useDataAttachments } from '../hooks/useDataAttachments';
import type { CrossDatasetInputs } from '../types/sdmx';
import { ConnectionStatus } from './ConnectionStatus';
import { DataView } from './DataView';
import { ErrorBanner } from './ErrorBanner';
import { FullscreenButton } from './FullscreenButton';
import { MainPlaceholder } from './MainPlaceholder';
import { TextResponse } from './TextResponse';

interface Props {
  snapshot: BridgeSnapshot;
  loading: boolean;
  error: string | null;
  emptyState: EmptyStateContent | null;
  isFillHeight: boolean;
  isFullscreen: boolean;
  canRequestFullscreen: boolean;
  requestFullscreen: () => void;
  crossDataset: CrossDatasetInputs | null;
  meta: WidgetMeta | null;
  effectiveLocale: string;
  pythonCode: string | undefined;
  chartTransformOption?: (
    option: EChartsOption,
    ctx: { isMobile: boolean },
  ) => EChartsOption;
  platform: Platform;
}

export function AppContent({
  snapshot,
  loading,
  error,
  emptyState,
  isFillHeight,
  isFullscreen,
  canRequestFullscreen,
  requestFullscreen,
  crossDataset,
  meta,
  effectiveLocale,
  pythonCode,
  chartTransformOption,
  platform,
}: Props) {
  const closePanel = useConversationViewSidePanelOptional()?.closePanel;
  const { chartAttachment, crossDatasetGridAttachment, externalLinksMap } =
    useDataAttachments({
      crossDataset,
      meta,
      effectiveLocale,
      isFullscreen,
    });

  useEffect(() => {
    if (!isFullscreen) closePanel?.();
  }, [isFullscreen, closePanel]);

  const hasData = !!crossDatasetGridAttachment;
  const showLoader = loading && !hasData;
  const showFallback = !showLoader && !hasData && !error && !!emptyState;

  useEffect(() => {
    if (showFallback) {
      document.documentElement.dataset.emptyState = 'true';
    } else {
      delete document.documentElement.dataset.emptyState;
    }
    return () => {
      delete document.documentElement.dataset.emptyState;
    };
  }, [showFallback]);

  if (snapshot.phase !== 'ready' && snapshot.phase !== 'tool-pending') {
    return (
      <ConnectionStatus phase={snapshot.phase} lastError={snapshot.lastError} />
    );
  }

  function renderContent() {
    if (showLoader) {
      return <MainPlaceholder />;
    }

    if (emptyState) {
      return emptyState.kind === EmptyStateKind.Error ? (
        <ErrorBanner message={emptyState.message} />
      ) : (
        <TextResponse text={emptyState.message} />
      );
    }

    return (
      <div className="relative flex min-h-0 flex-1 flex-row">
        <div className="min-w-0 flex-1">
          <DataView
            chartAttachment={chartAttachment}
            crossDatasetGridAttachment={crossDatasetGridAttachment}
            externalLinksMap={externalLinksMap}
            pythonCode={pythonCode}
            codeTheme={snapshot.hostContext?.theme}
            fillHeight={isFillHeight}
            chartTransformOption={chartTransformOption}
            platform={platform}
            isFullscreen={isFullscreen}
          />
        </div>
        {isFullscreen && (
          <ConversationViewSidePanelOutlet scope="conversation" />
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
        !showFallback && (
          <FullscreenButton
            onRequestFullscreen={requestFullscreen}
            platform={platform}
          />
        )}

      {error && <ErrorBanner message={error} />}

      {renderContent()}
    </div>
  );
}
