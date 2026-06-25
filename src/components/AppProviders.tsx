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
