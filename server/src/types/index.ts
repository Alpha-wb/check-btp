export interface User {
  id: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  role: 'superadmin' | 'moa' | 'moe' | 'entreprise';
  company?: string;
  phone?: string;
  created_at: string;
}

export interface Program {
  id: string;
  name: string;
  address?: string;
  city?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  status: 'actif' | 'termine' | 'suspendu';
  created_by: string;
  created_at: string;
}

export interface ProgramMember {
  id: string;
  program_id: string;
  user_id: string;
  role: 'admin' | 'membre' | 'lecteur';
  added_at: string;
}

export interface Operation {
  id: string;
  program_id: string;
  name: string;
  description?: string;
  building?: string;
  floor?: string;
  status: 'a_faire' | 'en_cours' | 'termine';
  assigned_to?: string;
  due_date?: string;
  created_at: string;
}

export interface Control {
  id: string;
  operation_id: string;
  fico_type: string;
  status: 'conforme' | 'non_conforme' | 'en_attente' | 'na';
  checked_by?: string;
  checked_at?: string;
  comments?: string;
  data: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  message: string;
  read: number;
  program_id?: string;
  created_at: string;
}

export interface AuthPayload {
  userId: string;
  email: string;
  role: string;
}
