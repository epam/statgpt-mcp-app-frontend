import type { McpUiHostContext } from '@modelcontextprotocol/ext-apps';
import { BridgeError, type BridgeSnapshot, type HostBridge } from './types';
import { unwrapStructured } from './utils';

declare global {
  interface Window {
    openai?: {
      toolInput?: unknown;
      toolOutput?: unknown;
      widgetState?: unknown;
      displayMode?: 'inline' | 'fullscreen' | 'pip' | string;
      maxHeight?: number;
      callTool?: (name: string, args: unknown) => Promise<unknown>;
      requestDisplayMode?: (args: { mode: string }) => Promise<unknown>;
      updateModelContext?: (args: { content: unknown[] }) => Promise<unknown>;
      sendFollowUpMessage?: (args: {
        prompt: string;
        scrollToBottom?: boolean;
      }) => Promise<unknown>;
    };
  }
  interface WindowEventMap {
    'openai:set_globals': CustomEvent<{
      globals?: {
        toolInput?: unknown;
        toolOutput?: unknown;
        widgetState?: unknown;
      };
    }>;
  }
}

type Listener = () => void;

function readHostContext(): McpUiHostContext {
  return {
    displayMode:
      (window.openai?.displayMode as McpUiHostContext['displayMode']) ??
      'inline',
    ...(window.openai?.maxHeight != null && {
      containerDimensions: { width: 0, height: window.openai.maxHeight },
    }),
  } as McpUiHostContext;
}

export function createChatGPTBridge(): HostBridge {
  let started = false;
  const listeners = new Set<Listener>();

  let snapshot: BridgeSnapshot = { phase: 'connecting', toolResult: null };

  function emit() {
    listeners.forEach((l) => l());
  }

  function patch(next: Partial<BridgeSnapshot>) {
    snapshot = { ...snapshot, ...next };
    emit();
  }

  function onSetGlobals(e: Event) {
    const globals =
      (
        e as CustomEvent<{
          globals?: { toolInput?: unknown; toolOutput?: unknown };
        }>
      ).detail?.globals ?? {};
    // Only forward toolOutput when this event itself carries a new value.
    // set_globals fires on every host layout tick; re-reading window.openai.toolOutput
    // here would trigger a re-fetch on every scroll — the "blinking widget" bug.
    if (globals.toolOutput !== undefined) {
      patch({
        toolResult: globals.toolOutput,
        hostContext: readHostContext(),
      });
    } else {
      patch({ hostContext: readHostContext() });
    }
  }

  function start() {
    if (started) return;
    started = true;

    const toolOutput = window.openai?.toolOutput;
    patch({
      phase: 'ready',
      hostContext: readHostContext(),
      ...(toolOutput !== undefined && { toolResult: toolOutput }),
    });

    window.addEventListener('openai:set_globals', onSetGlobals, {
      passive: true,
    });
  }

  return {
    start,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot() {
      return snapshot;
    },
    async callTool(name: string, args: unknown) {
      if (typeof window.openai?.callTool !== 'function') {
        throw new BridgeError('window.openai.callTool not available');
      }
      const result = await window.openai.callTool(name, args);
      return unwrapStructured(result);
    },
  };
}
