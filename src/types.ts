export interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'member';
  background_url?: string;
  profile_url?: string;
}

export interface Transaction {
  id: number;
  user_id: number;
  user_name?: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  description?: string;
}

export interface Budget {
  id: number;
  category: string;
  limit_amount: number;
  month: string;
}

export interface Bill {
  id: number;
  name: string;
  amount: number;
  due_date: string;
  status: 'paid' | 'unpaid';
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  due_date?: string;
  status: 'pending' | 'in-progress' | 'completed';
  assigned_to?: number;
  assigned_name?: string;
}

export interface GroceryItem {
  id: number;
  item: string;
  status: 'pending' | 'bought';
  user_id?: number;
  user_name?: string;
}

export interface ChatMessage {
  id: number;
  user_id: number;
  user_name: string;
  profile_url?: string;
  message: string;
  created_at: string;
}

export interface GalleryItem {
  id: number;
  user_id: number;
  user_name: string;
  title?: string;
  image_url: string;
  created_at: string;
}
