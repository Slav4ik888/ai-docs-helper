import type { DocumentType } from '../model/types';

/**
 * Returns an emoji-style icon for each document type. Kept as text so it
 * works without an icon library.
 */
export function getIconByType(type: DocumentType): string {
  switch (type) {
    case 'pdf':
      return '📕';
    case 'word':
      return '📘';
    case 'gdocs':
      return '🔗';
    default:
      return '📄';
  }
}

export function getLabelByType(type: DocumentType): string {
  switch (type) {
    case 'pdf':
      return 'PDF';
    case 'word':
      return 'Word';
    case 'gdocs':
      return 'Google Docs';
    default:
      return 'Документ';
  }
}
