import type { BridgePhase } from '../bridge/types';
import { Centered } from './Centered';
import { Loader } from './Loader';

/**
 * Renders UI for non-ready bridge phases: a spinner for `connecting`, an error
 * message for `error`, and a "session ended" message for `torndown`.
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
    return (
      <Centered>
        <Loader />
        <p className="mt-3 text-sm text-neutrals-700">
          Connecting to the host…
        </p>
      </Centered>
    );
  }
  if (phase === 'error') {
    return (
      <Centered>
        <p className="font-semibold text-semantic-error">
          Could not connect to the host
        </p>
        <p className="mt-2 max-w-md text-center text-sm text-neutrals-700">
          {lastError}
        </p>
      </Centered>
    );
  }
  return (
    <Centered>
      <p className="text-sm text-neutrals-700">Session ended by the host.</p>
    </Centered>
  );
}
