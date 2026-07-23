import type { ReactNode } from 'react';
import {
  AdvancedViewProvider,
  ConversationViewFeatureTogglesProvider,
  ConversationViewSidePanelProvider,
  ConversationViewStylesProvider,
  DatasetDimensionsMetadataMapProvider,
  OnboardingProvider,
} from '@epam/statgpt-conversation-view';
import type { DatasetsMetadataMaps } from '../hooks/useDatasetsMetadata';

interface Props {
  children: ReactNode;
  isMetadataInSidePanel?: boolean;
  datasetsMetadata: DatasetsMetadataMaps;
}

/**
 * Composes the required `@epam/statgpt-conversation-view` context providers into a single wrapper.
 *
 * @param children - Application subtree that requires the conversation-view context stack.
 * @param isMetadataInSidePanel - When true, grid metadata indicators open in a side panel (rendered via `ConversationViewSidePanelOutlet`) instead of their inline modal fallback.
 * @param datasetsMetadata - Dimensions/last-updated maps from the datasets-metadata tool; empty maps degrade gracefully to unresolved grid labels.
 */
export function AppProviders({
  children,
  isMetadataInSidePanel,
  datasetsMetadata,
}: Props) {
  return (
    <ConversationViewStylesProvider>
      <OnboardingProvider>
        <AdvancedViewProvider>
          <ConversationViewFeatureTogglesProvider
            isMetadataInSidePanel={isMetadataInSidePanel}
          >
            <ConversationViewSidePanelProvider>
              <DatasetDimensionsMetadataMapProvider
                map={datasetsMetadata.dimensionsMap}
                lastUpdatedMap={datasetsMetadata.lastUpdatedMap}
              >
                {children}
              </DatasetDimensionsMetadataMapProvider>
            </ConversationViewSidePanelProvider>
          </ConversationViewFeatureTogglesProvider>
        </AdvancedViewProvider>
      </OnboardingProvider>
    </ConversationViewStylesProvider>
  );
}
