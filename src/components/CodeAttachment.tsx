import classNames from 'classnames';
import { Editor, OnMount } from '@monaco-editor/react';
import '../monaco/setupMonaco';

const MONACO_THEME: Record<'light' | 'dark', string> = {
  light: 'vs',
  dark: 'vs-dark',
};

interface Props {
  code: string;
  theme?: 'light' | 'dark';
  fillHeight?: boolean;
  className?: string;
}

/**
 * Read-only Python code viewer backed by the widget's locally bundled Monaco
 * build (see `src/monaco/setupMonaco.ts`). This module is loaded via
 * `React.lazy` in `DataView`, so the `setupMonaco` side-effect import above
 * only fetches Monaco's editor bundle the first time a code attachment is
 * actually shown, instead of at app boot.
 *
 * Monaco's `automaticLayout` measures its container's actual height, so
 * `h-full` alone collapses to a few px when the parent chain has no defined
 * height (e.g. outside fullscreen, where `DataView`'s tab content pane is
 * auto-height). Mirrors the fixed-height fallback used by
 * `CustomChartAttachment`/`CrossDatasetGridAttachment` for the same reason.
 */
export function CodeAttachment({
  code,
  theme = 'light',
  fillHeight,
  className,
}: Props) {
  const handleMount: OnMount = (editor, monacoInstance) => {
    editor.addCommand(monacoInstance.KeyCode.F1, () => {});
  };

  return (
    <div
      className={classNames(
        'w-full [&_.cursors-layer]:hidden',
        fillHeight ? 'h-full' : 'h-[400px] max-h-[400px] min-h-[400px]',
        className,
      )}
    >
      <Editor
        value={code}
        language="python"
        theme={MONACO_THEME[theme]}
        onMount={handleMount}
        options={{
          readOnly: true,
          contextmenu: false,
          scrollBeyondLastLine: false,
          minimap: { enabled: false },
          wordWrap: 'on',
          automaticLayout: true,
          tabSize: 4,
        }}
      />
    </div>
  );
}
