import { useEffect } from 'react';
import classNames from 'classnames';
import {
  ConversationViewSidePanelOutlet,
  useConversationViewSidePanelOptional,
} from '@epam/statgpt-conversation-view';
import type { EChartsOption } from 'echarts-for-react/src/types';
import type { BridgeSnapshot, WidgetMeta } from '../bridge/types';
import { EmptyStateKind, type EmptyStateContent } from '../bridge/emptyState';
import { HostKind, Platform } from '../host/hostContext';
import { useDataAttachments } from '../hooks/useDataAttachments';
import type { CrossDatasetInputs } from '../types/sdmx';
import { ConnectionStatus } from './ConnectionStatus';
import { DataView } from './DataView';
import { EmptyStateTabs } from './EmptyStateTabs';
import { ErrorBanner } from './ErrorBanner';
import { FullscreenButton } from './FullscreenButton';
import { GridPlaceholder } from './GridPlaceholder';
import { TextResponse } from './TextResponse';

/**
 * Right padding reserved on the empty-state message so its text doesn't
 * wrap underneath the floating `FullscreenButton`, sized to the button's
 * per-platform footprint (`ICON_SIZE[platform]` + its own padding) plus a
 * small gap.
 */
const FULLSCREEN_BUTTON_GUTTER: Record<Platform, string> = {
  [Platform.Desktop]: 'pr-10',
  [Platform.Mobile]: 'pr-11',
};

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
  hostKind: HostKind;
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
  hostKind,
}: Props) {
  const closePanel = useConversationViewSidePanelOptional()?.closePanel;
  const { chartAttachment, crossDatasetGridAttachment } = useDataAttachments({
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
  const hasEmptyStateGrid = !!emptyState && emptyState.tabs.length > 0;
  /**
   * The last clause excludes only genuine inline mode's plain `DataView`
   * content (no `emptyState`, `isFillHeight` false) — `GridRowLimitFooter`
   * now always renders there (even when nothing is truncated), carrying its
   * own "Open full view" button, so the floating one would be redundant.
   * Pip and the empty-state-tabs fallback are unaffected either way.
   */
  const showFullscreenButton =
    canRequestFullscreen &&
    !isFullscreen &&
    !showLoader &&
    (!showFallback || hasEmptyStateGrid) &&
    (isFillHeight || !!emptyState);

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
      return <GridPlaceholder />;
    }

    if (emptyState) {
      return emptyState.kind === EmptyStateKind.Error ? (
        <ErrorBanner
          message={emptyState.message}
          isMobile={platform === Platform.Mobile}
          isInline={!isFillHeight}
        />
      ) : (
        <div
          className={classNames('flex flex-col gap-1', {
            'min-h-0 flex-1': isFillHeight,
            'pb-3': platform === Platform.Mobile && !isFillHeight,
          })}
        >
          <div
            className={classNames({
              [FULLSCREEN_BUTTON_GUTTER[platform]]: showFullscreenButton,
            })}
          >
            <TextResponse
              text={emptyState.message}
              isMobile={platform === Platform.Mobile}
              isInline={!isFillHeight}
            />
          </div>
          <EmptyStateTabs
            tabs={emptyState.tabs}
            fillHeight={isFillHeight}
            platform={platform}
          />
        </div>
      );
    }

    return (
      <div className="relative flex min-h-0 flex-1 flex-row">
        <div className="min-w-0 flex-1">
          <DataView
            chartAttachment={chartAttachment}
            crossDatasetGridAttachment={crossDatasetGridAttachment}
            pythonCode={pythonCode}
            codeTheme={snapshot.hostContext?.theme}
            fillHeight={isFillHeight}
            chartTransformOption={chartTransformOption}
            platform={platform}
            isFullscreen={isFullscreen}
            canRequestFullscreen={canRequestFullscreen}
            requestFullscreen={requestFullscreen}
          />
        </div>
        {isFullscreen && (
          <ConversationViewSidePanelOutlet scope="conversation" />
        )}
      </div>
    );
  }

  const isChatGptNonMobile =
    hostKind === HostKind.ChatGpt && platform !== Platform.Mobile;

  return (
    <div
      className={classNames('relative flex flex-col', {
        'm-4': !isFullscreen && (isFillHeight || showLoader),
        'h-full': isFillHeight,
        'min-h-[var(--mcp-widget-min-height)]': !isFillHeight && showLoader,
        'p-3': isChatGptNonMobile && !isFullscreen,
      })}
    >
      {showFullscreenButton && (
        <FullscreenButton
          onRequestFullscreen={requestFullscreen}
          platform={platform}
        />
      )}

      {error && (
        <ErrorBanner
          message={error}
          isMobile={platform === Platform.Mobile}
          isInline={!isFillHeight}
        />
      )}

      {renderContent()}
    </div>
  );
}
