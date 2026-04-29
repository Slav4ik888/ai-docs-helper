export type DocumentType = 'pdf' | 'word' | 'gdocs';
export type IndexStatus = 'pending' | 'ok' | 'error';

export interface Document {
  id: number;
  type: DocumentType;
  title: string;
  urlOrPath: string;
  createdAt: string;
  indexStatus: IndexStatus;
  indexError: string | null;
}
