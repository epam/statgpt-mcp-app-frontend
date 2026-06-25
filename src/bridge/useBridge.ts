import { useSyncExternalStore } from 'react';
import { bridge } from '.';
import type { BridgeSnapshot } from './types';

export function useBridgeSnapshot(): BridgeSnapshot {
  return useSyncExternalStore(bridge.subscribe, bridge.getSnapshot);
}
