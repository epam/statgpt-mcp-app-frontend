import type { ReactNode } from 'react';
import {
  AdvancedViewProvider,
  ConversationViewFeatureTogglesProvider,
  ConversationViewStylesProvider,
  OnboardingProvider,
} from '@epam/statgpt-conversation-view';

interface Props {
  children: ReactNode;
}

/**
 * Composes the required `@epam/statgpt-conversation-view` context providers into a single wrapper.
 *
 * @param children - Application subtree that requires the conversation-view context stack.
 */
export function AppProviders({ children }: Props) {
  return (
    <ConversationViewStylesProvider>
      <OnboardingProvider>
        <AdvancedViewProvider>
          <ConversationViewFeatureTogglesProvider>
            {children}
          </ConversationViewFeatureTogglesProvider>
        </AdvancedViewProvider>
      </OnboardingProvider>
    </ConversationViewStylesProvider>
  );
}
