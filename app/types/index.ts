export interface User {
  id: string;
  email: string;
  full_name?: string;
  partner_id?: string;
  invitation_code?: string;
  created_at: string;
  updated_at: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: QuizOption[];
  category: string;
}

export interface QuizOption {
  id: string;
  label: string;
  emoji: string;
  value: string;
}

export interface QuizResponse {
  id: string;
  user_id: string;
  question_id: string;
  answer: string;
  created_at: string;
}

export interface DateIdea {
  id: string;
  title: string;
  description: string;
  image_url: string;
  duration: string;
  category: string;
  difficulty?: string;
  cost?: string;
  location_type?: string;
  area?: string;
  generated_by?: 'ai' | 'community';
  created_at: string;
}

export interface DateSwipe {
  id: string;
  user_id: string;
  date_idea_id: string;
  direction: 'left' | 'right';
  created_at: string;
}

export interface DateMatch {
  id: string;
  user1_id: string;
  user2_id: string;
  date_idea_id: string;
  status: 'matched' | 'planned' | 'completed';
  planned_date?: string;
  created_at: string;
}

export interface UserDateTodo {
  id: string;
  user_id: string;
  date_idea_id: string;
  status: 'todo' | 'planned' | 'completed';
  planned_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  image_url: string;
  category: string;
  points: number;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
  progress?: number;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  image_url: string;
  category: string;
  duration_days: number;
  points_reward: number;
  is_active: boolean;
}

export interface Colors {
  primary: string;
  backgroundLight: string;
  backgroundDark: string;
  textLight: string;
  textDark: string;
  border: string;
  card: string;
  muted: string;
}

export interface NavigationProps {
  navigation: any;
  route?: any;
}

export type RootStackParamList = {
  Welcome: undefined;
  Auth: undefined;
  CityInput: { returnTo?: 'ModeChoice'; mode?: 'solo' | 'couple' };
  ModeChoice: { city?: string };
  Quiz: { city?: string; isCoupleMode?: boolean; roomId?: string; roomCode?: string; isRoomCreator?: boolean; isRoomMember?: boolean };
  SwipeDate: { quizAnswers: { [key: string]: string }; city?: string; roomId?: string; isCoupleMode?: boolean };
  Match: { matches: any[] };
  Room: { roomId?: string; city?: string };
  MainTab: undefined;
  Community: undefined;
  Gamification: undefined;
};
