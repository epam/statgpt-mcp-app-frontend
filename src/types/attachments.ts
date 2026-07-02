import type { ChartingData, GridData } from '@epam/statgpt-conversation-view';
import type { ColDef } from 'ag-grid-community';
import { ATTACHMENT_TYPE } from '../constants/attachmentTypes';

export interface ChartAttachment {
  type: typeof ATTACHMENT_TYPE.CUSTOM_CHART;
  title: string;
  charting_data?: ChartingData;
}

export interface CrossDatasetGridAttachmentData {
  data: GridData[];
  columns: ColDef[];
}
