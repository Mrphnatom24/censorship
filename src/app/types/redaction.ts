// types/redaction.ts
export interface RedactionResponse {
  original: string;
  censored: string;
  engine: string;
  error?: string;
}

