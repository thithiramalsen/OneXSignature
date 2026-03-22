export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'user';
}

export interface Signature {
  id: string;
  user_id: string;
  name: string;
  original_filename: string;
  file_path: string;
  file_size: number;
  is_seal: boolean;
  created_at: string;
  usage_count?: number;
}

export interface Document {
  id: string;
  user_id: string;
  name: string;
  original_filename: string;
  file_size: number;
  page_count: number;
  status: 'pending' | 'signed' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface SignedDocument {
  id: string;
  document_id: string;
  user_id: string;
  file_path: string;
  file_size: number;
  document_name: string;
  original_filename: string;
  created_at: string;
}

export interface SignaturePlacement {
  signature_id: string;
  page_number: number;
  x_position: number;
  y_position: number;
  width: number;
  height: number;
  rotation?: number;
}

export interface AuthResponse {
  token: string;
  user: User;
  message: string;
}

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'user';
  created_at: string;
}
