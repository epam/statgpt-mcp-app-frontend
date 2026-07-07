import { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js';
import 'monaco-editor/esm/vs/editor/editor.all.js';
import 'monaco-editor/esm/vs/basic-languages/python/python.contribution.js';

/**
 * Points @monaco-editor/react at this locally bundled, Python-only Monaco
 * build instead of its default behavior of fetching the full editor from a
 * CDN at runtime — required for the widget's sandboxed-iframe CSP, which
 * doesn't allow loading executable code from third-party origins.
 *
 * No worker is registered on purpose: the only worker Monaco ships that
 * isn't language-specific (`editorWorkerService`) is used for features like
 * diffing that this read-only single-snippet viewer never exercises. Monaco
 * falls back to running that service on the main thread when no worker is
 * available, which avoids bundling and instantiating a Worker for no
 * practical benefit here.
 */
loader.config({ monaco });
