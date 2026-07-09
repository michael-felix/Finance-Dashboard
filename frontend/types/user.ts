export interface UserProfile {
  id: number;
  supabase_user_id: string;
  email: string;
  is_admin: boolean;
  created_at: string;
}

export interface UserListResponse {
  items: UserProfile[];
}
