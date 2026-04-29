export interface Source {
  title: string;
  url: string | null;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
}
