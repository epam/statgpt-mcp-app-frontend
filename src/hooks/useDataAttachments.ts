import { useMemo } from 'react';
import {
  buildCrossDatasetGridContent,
  buildCrossDatasetChartingData,
} from '@epam/statgpt-conversation-view';
import type { WidgetMeta } from '../bridge/types';
import type { CrossDatasetInputs } from '../types/sdmx';
import { dropMetadataIconColumn } from '../adapters/gridColumns';
import { ATTACHMENT_TYPE } from '../constants/attachmentTypes';
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
      ),
    };
  }, [crossDataset, meta, effectiveLocale]);

  const crossDatasetGridAttachment = useMemo(():
    | CrossDatasetGridAttachmentData
    | undefined => {
    if (!crossDataset) return undefined;
    const content = buildCrossDatasetGridContent(
      crossDataset.structuresMap,
      crossDataset.dataMessagesMap,
      new Map(),
      crossDataset.dataQueries,
      effectiveLocale,
    );
    return isFullscreen ? content : dropMetadataIconColumn(content);
  }, [crossDataset, effectiveLocale, isFullscreen]);

  return { chartAttachment, crossDatasetGridAttachment };
}
