export interface User {
  id: string;
  email: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
}

export interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids?: number[];
  genres?: Genre[];
  runtime?: number;
  credits?: {
    cast: CastMember[];
    crew: CrewMember[];
  };
}

export interface Genre {
  id: number;
  name: string;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

export interface Rating {
  id: string;
  user_id: string;
  movie_id: number;
  score: number;
  review: string | null;
  watched_at: string;
  created_at: string;
  updated_at: string;
  user?: User;
  movie_title?: string;
  movie_poster?: string;
  movie_year?: string;
  likes_count?: number;
  comments_count?: number;
  has_liked?: boolean;
}

export interface Comment {
  id: string;
  rating_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: User;
  likes_count?: number;
  has_liked?: boolean;
}

export interface CommentLike {
  id: string;
  comment_id: string;
  user_id: string;
  created_at: string;
}

export interface Like {
  id: string;
  rating_id: string;
  user_id: string;
  created_at: string;
}

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface TasteStats {
  topAllTime: Rating[];
  topRecent: Rating[];
  topGenres: { genre: string; avgScore: number; count: number }[];
  topActors: { id: number; name: string; avgScore: number; count: number; profile_path: string | null }[];
  topDirectors: { id: number; name: string; avgScore: number; count: number; profile_path: string | null }[];
  totalRated: number;
  avgScore: number;
}

export interface TMDBSearchResult {
  page: number;
  results: Movie[];
  total_pages: number;
  total_results: number;
}

export interface TasteMatchResult {
  score: number | null;
  overlapCount: number;
  status: 'calculated' | 'insufficient_overlap' | 'loading' | 'error';
  message?: string;
  avgDifference?: number;
}

export interface WatchProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
  display_priority: number;
}

export interface WatchProviders {
  flatrate?: WatchProvider[];
  rent?: WatchProvider[];
  buy?: WatchProvider[];
  free?: WatchProvider[];
  link?: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  reported_user_id: string | null;
  reported_rating_id: string | null;
  reported_comment_id: string | null;
  reason: string;
  status: string;
  created_at: string;
}

export interface BlockedUser {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}

export interface Person {
  id: number;
  name: string;
  biography: string;
  birthday: string | null;
  deathday: string | null;
  place_of_birth: string | null;
  profile_path: string | null;
  known_for_department: string;
  also_known_as: string[];
  gender: number;
  popularity: number;
}

export interface PersonMovieCredit {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
  character?: string;
  job?: string;
  vote_average: number;
}

export type NotificationType = 'like' | 'comment' | 'follow';

export interface AppNotification {
  id: string;
  user_id: string;
  actor_id: string;
  type: NotificationType;
  rating_id: string | null;
  comment_id: string | null;
  read: boolean;
  created_at: string;
  actor?: User;
  rating?: Rating;
}
