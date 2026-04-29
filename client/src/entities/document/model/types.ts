export type DocumentType = 'pdf' | 'word' | 'gdocs';

export interface Document {
  id: number;
  type: DocumentType;
  title: string;
  urlOrPath: string;
  createdAt: string;
}
