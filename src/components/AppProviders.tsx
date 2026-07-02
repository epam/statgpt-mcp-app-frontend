import type { ReactNode } from 'react';
import {
  AdvancedViewProvider,
  ConversationViewFeatureTogglesProvider,
  ConversationViewSidePanelProvider,
  ConversationViewStylesProvider,
  OnboardingProvider,
} from '@epam/statgpt-conversation-view';

interface Props {
  children: ReactNode;
  isMetadataInSidePanel?: boolean;
}

/**
 * Composes the required `@epam/statgpt-conversation-view` context providers into a single wrapper.
 *
 * @param children - Application subtree that requires the conversation-view context stack.
 * @param isMetadataInSidePanel - When true, grid metadata indicators open in a side panel (rendered via `ConversationViewSidePanelOutlet`) instead of their inline modal fallback.
 */
export function AppProviders({ children, isMetadataInSidePanel }: Props) {
  return (
    <ConversationViewStylesProvider>
      <OnboardingProvider>
        <AdvancedViewProvider>
          <ConversationViewFeatureTogglesProvider
            isMetadataInSidePanel={isMetadataInSidePanel}
          >
            <ConversationViewSidePanelProvider>
              {children}
            </ConversationViewSidePanelProvider>
          </ConversationViewFeatureTogglesProvider>
        </AdvancedViewProvider>
      </OnboardingProvider>
    </ConversationViewStylesProvider>
  );
}
