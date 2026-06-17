import { Loader } from "@epam/statgpt-ui-components";
import type { BridgePhase } from "../bridge/types";
import { Centered } from "./Centered";

// Renders the pre-ready / terminal bridge phases. App only mounts this when
// the phase is not "ready", so a fallback covers any unexpected phase.
export function ConnectionStatus({ phase, lastError }: { phase: BridgePhase; lastError?: string }) {
  if (phase === "connecting") {
    return (
      <Centered>
        <Loader />
        <p className="mt-3 text-sm text-neutrals-700">Connecting to the host…</p>
      </Centered>
    );
  }
  if (phase === "error") {
    return (
      <Centered>
        <p className="font-semibold text-semantic-error">Could not connect to the host</p>
        <p className="mt-2 max-w-md text-center text-sm text-neutrals-700">{lastError}</p>
      </Centered>
    );
  }
  // "torndown" (or any other non-ready phase)
  return (
    <Centered>
      <p className="text-sm text-neutrals-700">Session ended by the host.</p>
    </Centered>
  );
}
