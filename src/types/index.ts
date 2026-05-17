export interface Publication {
  id: string;
  process_number: string;
  parties: string;
  publication_date: string; // YYYY-MM-DD
  content: string;
  summary: string;
  is_read: boolean;
  raw_hash: string;
  created_at: string; // ISO string
}

export interface ExecutionLog {
  id: string;
  status: 'success' | 'error';
  publications_found: number;
  publications_new: number;
  error_message?: string | null;
  executed_at: string; // ISO string
}

export interface OABCredential {
  name: string;
  number: string;
  state: string;
}

export interface OfficeSettings {
  id: string;
  oab_number: string;
  oab_state: string;
  openai_api_key: string;
  telegram_bot_token: string;
  telegram_chat_id: string;
  oabs?: OABCredential[];
  updated_at: string;
}


