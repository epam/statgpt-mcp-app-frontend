import classNames from 'classnames';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Props {
  text: string;
  /** Adds the widget's mobile edge padding when also `isInline`. */
  isMobile?: boolean;
  /** True outside pip/fullscreen, where the widget supplies its own margin instead. */
  isInline?: boolean;
}

/**
 * Renders the model-facing text accompanying a tool result, or a fallback
 * message when there is nothing to show (no `structuredContent` and no
 * result text). Left-aligned, matching how a host renders the model's own
 * text turns.
 *
 * @param text - The markdown text content to display.
 * @param isMobile - See `Props.isMobile`.
 * @param isInline - See `Props.isInline`.
 */
export function TextResponse({ text, isMobile, isInline }: Props) {
  return (
    <div
      className={classNames('prose prose-sm max-w-none text-neutrals-900', {
        'px-4 pt-3': isMobile && isInline,
      })}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children, ...props }) => (
            <a href={href} target="_blank" rel="noreferrer" {...props}>
              {children}
            </a>
          ),
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
