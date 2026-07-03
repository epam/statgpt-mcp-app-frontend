import { App } from '@modelcontextprotocol/ext-apps';
import type { McpUiHostContext } from '@modelcontextprotocol/ext-apps';
import { APP_NAME, APP_VERSION } from '../app.meta';
import { logger } from '../log/logger';
import { BridgeError, type BridgeSnapshot, type HostBridge } from './types';
import { unwrapStructured } from './utils';

type Listener = () => void;

/**
 * Creates a `HostBridge` backed by the spec-compliant MCP Apps UI protocol,
 * using the `@modelcontextprotocol/ext-apps` `App` class to manage connect,
 * tool-input, tool-result, and teardown lifecycle events.
 *
 * @returns A `HostBridge` instance ready to be started and subscribed to.
 */
export function createSpecBridge(): HostBridge {
  let sdkApp: App | null = null;
  let started = false;
  let connectPromise: Promise<void> | null = null;
  const listeners = new Set<Listener>();
  let snapshot: BridgeSnapshot = { phase: 'connecting', toolResult: null };

  function emit() {
    listeners.forEach((l) => l());
  }

  function patch(next: Partial<BridgeSnapshot>) {
    snapshot = { ...snapshot, ...next };
    emit();
  }

  function start() {
    if (started) return;
    started = true;

    sdkApp = new App(
      { name: APP_NAME, version: APP_VERSION },
      {},
      { autoResize: true },
    );

    sdkApp.ontoolinput = (_params) => {
      logger.debug('bridge', 'tool-input received');
      patch({ phase: 'tool-pending', toolResult: null });
    };

    sdkApp.ontoolresult = (params) => {
      const toolResult = unwrapStructured(params.structuredContent) ?? null;
      logger.debug('bridge', 'tool-result received', toolResult);
      patch({ phase: 'ready', toolResult });
    };

    sdkApp.ontoolcancelled = (params) => {
      logger.warn('bridge', 'tool cancelled', params.reason);
      patch({
        phase: 'error',
        lastError: `Tool cancelled${params.reason ? ': ' + params.reason : ''}`,
      });
    };

    sdkApp.onhostcontextchanged = (ctx: McpUiHostContext) => {
      logger.debug('bridge', 'host-context changed', ctx);
      patch({ hostContext: { ...snapshot.hostContext, ...ctx } });
    };

    sdkApp.onerror = (err: Error) => {
      logger.error('bridge', 'sdk error', err);
      patch({ phase: 'error', lastError: err.message });
    };

    sdkApp.onteardown = () => {
      logger.debug('bridge', 'teardown');
      patch({ phase: 'torndown' });
      return {};
    };

    connectPromise = sdkApp
      .connect()
      .then(() => {
        const hostContext = sdkApp!.getHostContext();
        logger.debug('bridge', 'handshake ok', hostContext);
        patch({ phase: 'ready', hostContext });
      })
      .catch((err: Error) => {
        logger.error('bridge', 'handshake failed', err);
        patch({ phase: 'error', lastError: err.message });
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
      if (!sdkApp) {
        logger.error('bridge', 'callTool before start', name);
        throw new BridgeError('bridge not started');
      }
      await connectPromise;
      const result = await sdkApp.callServerTool({
        name,
        arguments: args as Record<string, unknown>,
      });
      return unwrapStructured(result);
    },
  };
}
