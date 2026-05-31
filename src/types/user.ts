export interface User {
  _id?: string;
  id?: string;
  _id?: string;
  phone: string;
  displayName: string;
  username?: string;
  email?: string;
  bio?: string;
  avatar?: string;
  avatarUrl?: string; // Alias for compatibility
  status?: string;
  verified?: {
    email: boolean;
    phone: boolean;
  };
  createdAt?: string;
  updatedAt?: string;
}
