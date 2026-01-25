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
