export interface Citation {
  source: string;
  page?: number;
  text?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  citations?: Citation[];
}

export interface ChatRequest {
  message: string;
  model: string;
  history: Message[];
}

export interface ChatResponse {
  text: string;
  citations?: Citation[];
}