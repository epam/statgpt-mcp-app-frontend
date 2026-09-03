import { RowsTruncatedHint } from './RowsTruncatedHint';

interface Props {
  hasMoreRows: boolean;
}

/**
 * Renders the "more rows than shown" hint below the inline grid carousel
 * whenever the dataset has more rows than the current row cap displays — on
 * every column slide, not just the last one.
 * @param hasMoreRows - Whether the dataset has more rows than the row cap displays.
 */
export function GridSlideNav({ hasMoreRows }: Props) {
  if (!hasMoreRows) return null;
  return <RowsTruncatedHint />;
}
