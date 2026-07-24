import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Props {
  text: string;
}

/**
 * Renders the model-facing text accompanying a tool result when there is no
 * `structuredContent` to build an interactive view from (e.g. the model
 * couldn't resolve the user's query into a dataset). Left-aligned, matching
 * how a host renders the model's own text turns, rather than the centered
 * {@link EmptyState} treatment used for a resolved-but-empty query.
 *
 * @param text - The markdown text content to display.
 */
export function TextResponse({ text }: Props) {
  return (
    <div className="prose prose-sm max-w-none px-4 py-6 text-neutrals-900">
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
