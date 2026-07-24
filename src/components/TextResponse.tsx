import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Props {
  text: string;
}

/**
 * Renders the model-facing text accompanying a tool result, or a fallback
 * message when there is nothing to show (no `structuredContent` and no
 * result text). Left-aligned, matching how a host renders the model's own
 * text turns.
 *
 * @param text - The markdown text content to display.
 */
export function TextResponse({ text }: Props) {
  return (
    <div className="prose prose-sm max-w-none text-neutrals-900">
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
