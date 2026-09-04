import type { ColDef } from 'ag-grid-community';
import type { CrossDatasetGridAttachmentData } from '../types/attachments';

/**
 * `getCrossDatasetMetadataColumn` (statgpt-conversation-view) always
 * prepends this pinned 32px metadata-icon column with no `field`/`colId`;
 * this is the only stable way to identify and drop it from outside.
 */
function isMetadataIconColumn(col: ColDef): boolean {
  return col.pinned === true && col.maxWidth === 32 && col.width === 32;
}

export function dropMetadataIconColumn(
  content: CrossDatasetGridAttachmentData,
): CrossDatasetGridAttachmentData {
  return {
    ...content,
    columns: content.columns.filter((col) => !isMetadataIconColumn(col)),
  };
}

export function disableColumnDragging(
  content: CrossDatasetGridAttachmentData,
): CrossDatasetGridAttachmentData {
  return {
    ...content,
    columns: content.columns.map((col) => ({ ...col, suppressMovable: true })),
  };
}
