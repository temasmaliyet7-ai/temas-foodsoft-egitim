export type Role = 'admin' | 'user';

export interface User {
  id: string;
  username: string;
  role: Role;
  active: boolean;
  last_login_at: string | null;
  updated_at: string | null;
}

export interface AuthUser {
  id: string;
  username: string;
  role: Role;
}

export interface TrainingPage {
  id: string;
  page_number: number;
  image_url: string;
}

export interface TrainingSummary {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  sort_order: number;
  active: boolean;
  pageCount: number;
}

export interface TrainingDetail {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  active: boolean;
  pages: TrainingPage[];
}
