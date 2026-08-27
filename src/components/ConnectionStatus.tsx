import type { BridgePhase } from '../bridge/types';
import { GridPlaceholder } from './GridPlaceholder';
import { TextResponse } from './TextResponse';

/**
 * Renders UI for non-ready bridge phases: a skeleton placeholder for
 * `connecting`, an error message for `error`, and a "session ended" message
 * for `torndown`.
 *
 * The parent (`App`) only mounts this component when the phase is not `ready`
 * or `tool-pending`, so the component handles all pre-ready and terminal phases.
 * The final fallback branch covers `torndown` and any other unexpected phase.
 *
 * @example
 * ```tsx
 * <ConnectionStatus phase="connecting" />
 * ```
 *
 * @param phase - Current bridge lifecycle phase (e.g. `connecting`, `error`, `torndown`).
 * @param lastError - Optional error message displayed when `phase` is `error`.
 */
export function ConnectionStatus({
  phase,
  lastError,
}: {
  phase: BridgePhase;
  lastError?: string;
}) {
  if (phase === 'connecting') {
    return <GridPlaceholder />;
  }
  if (phase === 'error') {
    return (
      <div className="m-4">
        <TextResponse
          text={`**Could not connect to the host**\n\n${lastError ?? ''}`}
        />
      </div>
    );
  }
  return (
    <div className="m-4">
      <TextResponse text="Session ended by the host." />
    </div>
  );
}
