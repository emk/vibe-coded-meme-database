export interface Meme {
  id: number;
  path: string;
  filename: string;
  category: string;
  hash: string;
  text: string;
  description: string;
  keywords: string[];
  created_at: Date;
}

export interface MemeInput {
  path: string;
  filename: string;
  category: string;
  hash: string;
  text: string;
  description: string;
  keywords: string[];
}