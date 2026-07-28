import { useState } from 'react';
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
 * The container is sized to the editor's actual content height (via
 * `getContentHeight`/`onDidContentSizeChange`) rather than a fixed height,
 * so short snippets don't carry redundant blank space. A precomputed
 * line-count estimate isn't reliable here because `wordWrap: 'on'` means the
 * visual line count depends on the container's current width, which is only
 * known once Monaco has actually laid the text out. `max-h-[400px]` caps the
 * visible height the same way the grid tab caps its rows, with Monaco's own
 * internal scrollbar handling the overflow.
 */
export function CodeAttachment({
  code,
  theme = 'light',
  fillHeight,
  className,
}: Props) {
  const [contentHeight, setContentHeight] = useState<number | null>(null);

  const handleMount: OnMount = (editor, monacoInstance) => {
    editor.addCommand(monacoInstance.KeyCode.F1, () => {});

    const measure = () => setContentHeight(editor.getContentHeight());
    measure();
    editor.onDidContentSizeChange(measure);
  };

  return (
    <div
      className={classNames(
        'w-full [&_.cursors-layer]:hidden',
        fillHeight ? 'h-full' : 'max-h-[400px] min-h-[120px]',
        className,
      )}
      style={
        fillHeight || contentHeight === null
          ? undefined
          : { height: contentHeight }
      }
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
