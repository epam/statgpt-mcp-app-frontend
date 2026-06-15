interface Props {
  message: string;
}

export function ErrorBanner({ message }: Props) {
  return (
    <div className="rounded border border-semantic-error bg-semantic-error-light px-3 py-2 text-sm text-semantic-error">
      {message}
    </div>
  );
}
