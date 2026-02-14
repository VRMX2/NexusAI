
export enum Role {
  USER = 'user',
  ASSISTANT = 'assistant'
}

export enum SubscriptionPlan {
  FREE = 'free',
  PRO = 'pro'
}

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url: string;
  created_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface Message {
  id: string;
  project_id: string;
  role: Role;
  content: string;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  status: 'active' | 'canceled';
  current_period_end: string;
}
