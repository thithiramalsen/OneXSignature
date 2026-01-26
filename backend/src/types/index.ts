export interface User {
  id: string;
  email: string;
  password: string;
  full_name: string;
  role: 'admin' | 'user';
  created_at: Date;
  updated_at: Date;
}

export interface Signature {
  id: string;
  user_id: string;
  name: string;
  original_filename: string;
  processed_filename: string;
  file_path: string;
  file_size: number;
  is_seal: boolean;
  created_at: Date;
}

export interface Document {
  id: string;
  user_id: string;
  name: string;
  original_filename: string;
  file_path: string;
  file_size: number;
  page_count: number;
  status: 'pending' | 'signed' | 'archived';
  created_at: Date;
  updated_at: Date;
}

export interface SignedDocument {
  id: string;
  document_id: string;
  user_id: string;
  file_path: string;
  file_size: number;
  created_at: Date;
}

export interface SignaturePlacement {
  id: string;
  signed_document_id: string;
  signature_id: string;
  page_number: number;
  x_position: number;
  y_position: number;
  width: number;
  height: number;
  rotation: number;
  created_at: Date;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export interface AuthRequest extends Request {
  user?: JWTPayload;
}
