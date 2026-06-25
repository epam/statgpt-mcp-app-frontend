import { useSyncExternalStore } from 'react';
import { bridge } from '.';
import type { BridgeSnapshot } from './types';

/**
 * Subscribes a component to the bridge singleton and returns the latest snapshot of its state.
 */
export function useBridgeSnapshot(): BridgeSnapshot {
  return useSyncExternalStore(bridge.subscribe, bridge.getSnapshot);
}
