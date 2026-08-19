import type { ReactNode } from 'react';
import { useMemo } from 'react';
import {
  AdvancedViewProvider,
  ConversationViewFeatureTogglesProvider,
  ConversationViewSidePanelProvider,
  ConversationViewStylesProvider,
  DatasetDimensionsMetadataMapProvider,
  DatasetInfoDetailsProvider,
  OnboardingProvider,
  SidePanelCustomizationProvider,
} from '@epam/statgpt-conversation-view';
import type { DatasetsMetadataMaps } from '../hooks/useDatasetsMetadata';
import { Platform } from '../host/hostContext';
import { CloseIcon } from '../icons/CloseIcon';
import { DatasetIcon } from '../icons/DatasetIcon';
import { HostIconButton } from './HostIconButton';

interface Props {
  children: ReactNode;
  isMetadataInSidePanel?: boolean;
  datasetsMetadata: DatasetsMetadataMaps;
  platform: Platform;
}

const SIDE_PANEL_THEME_CLASSES =
  '[--primary:var(--semantic-info)] bg-[var(--color-background-primary,#fff)] border-l-0';

/**
 * Composes the required `@epam/statgpt-conversation-view` context providers into a single wrapper.
 *
 * @param children - Application subtree that requires the conversation-view context stack.
 * @param isMetadataInSidePanel - When true, grid metadata indicators open in a side panel (rendered via `ConversationViewSidePanelOutlet`) instead of their inline modal fallback.
 * @param datasetsMetadata - Dimensions/last-updated maps from the datasets-metadata tool; empty maps degrade gracefully to unresolved grid labels.
 * @param platform - Desktop/mobile bucket from the host context; drives the mobile-only full-width side panel override.
 */
export function AppProviders({
  children,
  isMetadataInSidePanel,
  datasetsMetadata,
  platform,
}: Props) {
  const panelClassName =
    platform === Platform.Mobile
      ? `${SIDE_PANEL_THEME_CLASSES} absolute inset-0 z-10 w-full`
      : SIDE_PANEL_THEME_CLASSES;

  const closeControl = useMemo(() => {
    function PanelCloseButton({ onClose }: { onClose: () => void }) {
      return (
        <HostIconButton
          icon={CloseIcon}
          platform={platform}
          onClick={onClose}
          ariaLabel="Close panel"
          className="relative"
        />
      );
    }
    return PanelCloseButton;
  }, [platform]);

  return (
    <ConversationViewStylesProvider>
      <OnboardingProvider>
        <AdvancedViewProvider>
          <ConversationViewFeatureTogglesProvider
            isMetadataInSidePanel={isMetadataInSidePanel}
          >
            <ConversationViewSidePanelProvider>
              <SidePanelCustomizationProvider
                value={{
                  closeControl,
                  classes: { panel: panelClassName },
                }}
              >
                <DatasetInfoDetailsProvider
                  value={{
                    icon: (
                      <DatasetIcon
                        platform={platform}
                        className="size-4 text-neutrals-700"
                      />
                    ),
                  }}
                >
                  <DatasetDimensionsMetadataMapProvider
                    map={datasetsMetadata.dimensionsMap}
                    lastUpdatedMap={datasetsMetadata.lastUpdatedMap}
                  >
                    {children}
                  </DatasetDimensionsMetadataMapProvider>
                </DatasetInfoDetailsProvider>
              </SidePanelCustomizationProvider>
            </ConversationViewSidePanelProvider>
          </ConversationViewFeatureTogglesProvider>
        </AdvancedViewProvider>
      </OnboardingProvider>
    </ConversationViewStylesProvider>
  );
}
