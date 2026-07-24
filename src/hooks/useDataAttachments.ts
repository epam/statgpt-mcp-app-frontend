import { useMemo } from 'react';
import {
  buildCrossDatasetGridContent,
  buildCrossDatasetChartingData,
  useDatasetDimensionsMetadataMapOptional,
} from '@epam/statgpt-conversation-view';
import type { WidgetMeta } from '../bridge/types';
import type { CrossDatasetInputs } from '../types/sdmx';
import { dropMetadataIconColumn } from '../adapters/gridColumns';
import { ATTACHMENT_TYPE } from '../constants/attachmentTypes';
import { formatNumbers } from '../constants/format-numbers';
import type {
  ChartAttachment,
  CrossDatasetGridAttachmentData,
} from '../types/attachments';

interface UseDataAttachmentsInput {
  crossDataset: CrossDatasetInputs | null;
  meta: WidgetMeta | null;
  effectiveLocale: string;
  isFullscreen: boolean;
}

interface UseDataAttachmentsResult {
  chartAttachment: ChartAttachment | undefined;
  crossDatasetGridAttachment: CrossDatasetGridAttachmentData | undefined;
}

export function useDataAttachments({
  crossDataset,
  meta,
  effectiveLocale,
  isFullscreen,
}: UseDataAttachmentsInput): UseDataAttachmentsResult {
  const chartAttachment = useMemo((): ChartAttachment | undefined => {
    if (!crossDataset) return undefined;
    return {
      type: ATTACHMENT_TYPE.CUSTOM_CHART,
      title: meta?.title ?? 'Chart',
      charting_data: buildCrossDatasetChartingData(
        crossDataset.structuresMap,
        crossDataset.dataMessagesMap,
        crossDataset.dataQueries,
        effectiveLocale,
        undefined,
        formatNumbers,
      ),
    };
  }, [crossDataset, meta, effectiveLocale]);

  const getDimensionsScheme =
    useDatasetDimensionsMetadataMapOptional()?.getDimensionsScheme;

  const crossDatasetGridAttachment = useMemo(():
    | CrossDatasetGridAttachmentData
    | undefined => {
    if (!crossDataset) return undefined;
    const dimensionsSchemesMap = new Map(
      crossDataset.dataQueries.map((q) => [
        q.urn,
        getDimensionsScheme?.(q.urn),
      ]),
    );
    const content = buildCrossDatasetGridContent(
      crossDataset.structuresMap,
      crossDataset.dataMessagesMap,
      dimensionsSchemesMap,
      crossDataset.dataQueries,
      effectiveLocale,
      formatNumbers,
    );
    return isFullscreen ? content : dropMetadataIconColumn(content);
  }, [crossDataset, effectiveLocale, isFullscreen, getDimensionsScheme]);

  return { chartAttachment, crossDatasetGridAttachment };
}
