import { useSdmxData } from './hooks/useSdmxData';
import { useDatasetsMetadata } from './hooks/useDatasetsMetadata';
import { useHostLayout } from './hooks/useHostLayout';
import { useHostTheme } from './hooks/useHostTheme';
import { useChartTheme } from './hooks/useChartTheme';
import { useInlineHeightSync } from './hooks/useInlineHeightSync';
import { usePlatform } from './host/hostContext';
import { AppProviders } from './components/AppProviders';
import { AppContent } from './components/AppContent';

export default function App() {
  const { snapshot, meta, crossDataset, loading, error, emptyState } =
    useSdmxData();
  const datasetsMetadata = useDatasetsMetadata(snapshot.phase);

  useHostTheme(snapshot.hostContext);
  const chartTransformOption = useChartTheme(snapshot.hostContext);
  const {
    isFillHeight,
    isFullscreen,
    canRequestFullscreen,
    requestFullscreen,
    locale,
  } = useHostLayout(snapshot.hostContext);
  const platform = usePlatform(snapshot.hostContext);
  useInlineHeightSync(!isFillHeight);
  const effectiveLocale = locale ?? 'en';

  return (
    <AppProviders
      isMetadataInSidePanel={isFullscreen}
      datasetsMetadata={datasetsMetadata}
      platform={platform}
    >
      <AppContent
        snapshot={snapshot}
        loading={loading}
        error={error}
        emptyState={emptyState}
        isFillHeight={isFillHeight}
        isFullscreen={isFullscreen}
        canRequestFullscreen={canRequestFullscreen}
        requestFullscreen={requestFullscreen}
        crossDataset={crossDataset}
        meta={meta}
        effectiveLocale={effectiveLocale}
        pythonCode={meta?.pythonCode}
        chartTransformOption={chartTransformOption}
        platform={platform}
      />
    </AppProviders>
  );
}
