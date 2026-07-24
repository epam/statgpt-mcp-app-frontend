import { v4 as uuidv4 } from 'uuid';

const DEBUG = import.meta.env.VITE_DEBUG !== 'false';

/**
 * Per-mount instance id, generated once when this module first loads. Lets
 * logs from multiple concurrently mounted widgets (e.g. several tool calls
 * in one chat) be told apart in the console.
 */
export const widgetId = uuidv4().slice(0, 8);

function format(tag: string, message: string): string {
  return `[widget:${widgetId}][${tag}] ${message}`;
}

/**
 * Tagged logger for widget diagnostics. `debug`/`info` are gated behind the
 * `VITE_DEBUG` build-time flag, which defaults to on so verbose logging works
 * out of the box in every environment without extra configuration. Set
 * `VITE_DEBUG=false` at build time to silence them once the integration
 * stabilizes. `warn`/`error` always print.
 */
export const logger = {
  debug(tag: string, message: string, ...args: unknown[]): void {
    if (!DEBUG) return;
    console.debug(format(tag, message), ...args);
  },
  info(tag: string, message: string, ...args: unknown[]): void {
    if (!DEBUG) return;
    console.info(format(tag, message), ...args);
  },
  warn(tag: string, message: string, ...args: unknown[]): void {
    console.warn(format(tag, message), ...args);
  },
  error(tag: string, message: string, ...args: unknown[]): void {
    console.error(format(tag, message), ...args);
  },
};
