import type { McpUiHostContext } from '@modelcontextprotocol/ext-apps';
import type { HostKind } from './types';

export function detectHostKind(ctx: McpUiHostContext | undefined): HostKind {
  if (ctx?.styles?.variables && Object.keys(ctx.styles.variables).length > 0) {
    return 'claude';
  }
  if (typeof window !== 'undefined' && 'openai' in window) {
    return 'chatgpt';
  }
  return 'generic';
}
