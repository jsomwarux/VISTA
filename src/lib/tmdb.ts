import { Movie, TMDBSearchResult, Genre, WatchProviders, Person, PersonMovieCredit } from '../types';

const TMDB_API_KEY = process.env.EXPO_PUBLIC_TMDB_API_KEY || '';
const TMDB_ACCESS_TOKEN = process.env.EXPO_PUBLIC_TMDB_ACCESS_TOKEN || '';
const BASE_URL = 'https://api.themoviedb.org/3';

const headers = {
  Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`,
  'Content-Type': 'application/json',
};

export const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

export const getImageUrl = (path: string | null, size: 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'original' = 'w500'): string | null => {
  if (!path) return null;
  return `${IMAGE_BASE_URL}/${size}${path}`;
};

export const searchMovies = async (query: string, page: number = 1): Promise<TMDBSearchResult> => {
  const response = await fetch(
    `${BASE_URL}/search/movie?query=${encodeURIComponent(query)}&page=${page}&include_adult=false`,
    { headers }
  );
  if (!response.ok) throw new Error('Failed to search movies');
  const data = await response.json();
  // Sort by popularity so well-known movies surface first
  data.results.sort((a: any, b: any) => (b.popularity ?? 0) - (a.popularity ?? 0));
  return data;
};

export const getTrendingMovies = async (timeWindow: 'day' | 'week' = 'week'): Promise<Movie[]> => {
  const response = await fetch(
    `${BASE_URL}/trending/movie/${timeWindow}`,
    { headers }
  );
  if (!response.ok) throw new Error('Failed to fetch trending movies');
  const data = await response.json();
  return data.results;
};

export const getPopularMovies = async (page: number = 1): Promise<TMDBSearchResult> => {
  const response = await fetch(
    `${BASE_URL}/movie/popular?page=${page}`,
    { headers }
  );
  if (!response.ok) throw new Error('Failed to fetch popular movies');
  return response.json();
};

export const getTopRatedMovies = async (page: number = 1): Promise<TMDBSearchResult> => {
  const response = await fetch(
    `${BASE_URL}/movie/top_rated?page=${page}`,
    { headers }
  );
  if (!response.ok) throw new Error('Failed to fetch top rated movies');
  return response.json();
};

export const getNowPlayingMovies = async (page: number = 1): Promise<TMDBSearchResult> => {
  const response = await fetch(
    `${BASE_URL}/movie/now_playing?page=${page}`,
    { headers }
  );
  if (!response.ok) throw new Error('Failed to fetch now playing movies');
  return response.json();
};

export const getMovieDetails = async (movieId: number): Promise<Movie> => {
  const response = await fetch(
    `${BASE_URL}/movie/${movieId}?append_to_response=credits`,
    { headers }
  );
  if (!response.ok) throw new Error('Failed to fetch movie details');
  return response.json();
};

export const getMovieCredits = async (movieId: number) => {
  const response = await fetch(
    `${BASE_URL}/movie/${movieId}/credits`,
    { headers }
  );
  if (!response.ok) throw new Error('Failed to fetch movie credits');
  return response.json();
};

export const getGenres = async (): Promise<Genre[]> => {
  const response = await fetch(
    `${BASE_URL}/genre/movie/list`,
    { headers }
  );
  if (!response.ok) throw new Error('Failed to fetch genres');
  const data = await response.json();
  return data.genres;
};

export const getPersonDetails = async (personId: number): Promise<Person> => {
  const response = await fetch(
    `${BASE_URL}/person/${personId}`,
    { headers }
  );
  if (!response.ok) throw new Error('Failed to fetch person details');
  return response.json();
};

export const getPersonMovieCredits = async (personId: number): Promise<{ cast: PersonMovieCredit[]; crew: PersonMovieCredit[] }> => {
  const response = await fetch(
    `${BASE_URL}/person/${personId}/movie_credits`,
    { headers }
  );
  if (!response.ok) throw new Error('Failed to fetch person credits');
  return response.json();
};

// Genre ID to name mapping
export const GENRE_MAP: Record<number, string> = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Sci-Fi',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
};

export const getGenreName = (genreId: number): string => {
  return GENRE_MAP[genreId] || 'Unknown';
};

export const getMovieWatchProviders = async (movieId: number, region: string = 'US'): Promise<WatchProviders | null> => {
  const response = await fetch(
    `${BASE_URL}/movie/${movieId}/watch/providers`,
    { headers }
  );
  if (!response.ok) return null;
  const data = await response.json();
  return data.results?.[region] || null;
};
