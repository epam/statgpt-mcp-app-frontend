import { useSdmxData } from './hooks/useSdmxData';
import { useHostLayout } from './hooks/useHostLayout';
import { useHostTheme } from './hooks/useHostTheme';
import { useChartTheme } from './hooks/useChartTheme';
import { useDataAttachments } from './hooks/useDataAttachments';
import { useInlineHeightSync } from './hooks/useInlineHeightSync';
import { AppProviders } from './components/AppProviders';
import { AppContent } from './components/AppContent';

export default function App() {
  const { snapshot, meta, crossDataset, loading, error } = useSdmxData();

  useHostTheme(snapshot.hostContext);
  const chartTransformOption = useChartTheme(snapshot.hostContext);
  const { isFillHeight, isFullscreen, locale } = useHostLayout(
    snapshot.hostContext,
  );
  useInlineHeightSync(!isFillHeight);
  const effectiveLocale = locale ?? 'en';

  const { chartAttachment, crossDatasetGridAttachment } = useDataAttachments({
    crossDataset,
    meta,
    effectiveLocale,
    isFullscreen,
  });

  return (
    <AppProviders isMetadataInSidePanel={isFullscreen}>
      <AppContent
        snapshot={snapshot}
        loading={loading}
        error={error}
        isFillHeight={isFillHeight}
        isFullscreen={isFullscreen}
        chartAttachment={chartAttachment}
        crossDatasetGridAttachment={crossDatasetGridAttachment}
        pythonCode={meta?.pythonCode}
        chartTransformOption={chartTransformOption}
      />
    </AppProviders>
  );
}
