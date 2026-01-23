import { ViewStyle } from 'react-native';

// Premium cinematic color palette
export const colors = {
  // Backgrounds
  background: '#0A0A0B',          // Deep charcoal (not pure black)
  surface: '#151518',             // Elevated dark for cards
  surfaceLight: '#1A1A1D',        // Slightly lighter surface
  surfaceLighter: '#252528',      // Border color / dividers

  // Primary Accent (Warm Amber)
  primary: '#F59E0B',             // Amber - main accent
  primaryDark: '#D97706',         // Darker amber for gradients
  primaryLight: '#FBBF24',        // Lighter amber
  primaryMuted: 'rgba(245, 158, 11, 0.15)',  // Subtle amber background
  amber: '#F59E0B',               // Alias for primary

  // Secondary Accent
  coral: '#FB7185',               // Soft coral for likes/hearts

  // Text
  text: '#FAFAFA',                // Off-white
  textSecondary: '#A1A1AA',       // Zinc-400
  textMuted: '#71717A',           // Zinc-500

  // Status
  success: '#10B981',             // Emerald
  error: '#EF4444',               // Red
  warning: '#F59E0B',             // Amber

  // Score Gradient (green for high → red for low)
  scoreExcellent: '#10B981',      // 90-100: Emerald green
  scoreGreat: '#22C55E',          // 80-89: Green
  scoreGood: '#84CC16',           // 70-79: Lime
  scoreMid: '#EAB308',            // 50-69: Yellow
  scoreAverage: '#F97316',        // 30-49: Orange
  scorePoor: '#EF4444',           // 0-29: Red

  // Utility
  border: '#252528',
  overlay: 'rgba(0, 0, 0, 0.7)',
  overlayLight: 'rgba(0, 0, 0, 0.5)',
  glass: 'rgba(21, 21, 24, 0.85)',
  transparent: 'transparent',

  // Gradient endpoints (for LinearGradient)
  gradientStart: '#F59E0B',
  gradientEnd: '#D97706',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  full: 9999,
};

// Shadow presets for depth
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  } as ViewStyle,
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  } as ViewStyle,
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  } as ViewStyle,
};

// Glow effect generator
export const getGlowStyle = (color: string): ViewStyle => ({
  shadowColor: color,
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.5,
  shadowRadius: 12,
  elevation: 8,
});

// Enhanced glow for FAB (subtler, wider)
export const getEnhancedGlowStyle = (color: string): ViewStyle => ({
  shadowColor: color,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.35,
  shadowRadius: 16,
  elevation: 12,
});

// Score color function with gradient scale
export const getScoreColor = (score: number): string => {
  if (score >= 90) return colors.scoreExcellent;  // Emerald
  if (score >= 80) return colors.scoreGreat;       // Green
  if (score >= 70) return colors.scoreGood;        // Lime
  if (score >= 50) return colors.scoreMid;         // Yellow
  if (score >= 30) return colors.scoreAverage;     // Orange
  return colors.scorePoor;                          // Red
};

// Genre colors for accent variety
export const genreColors: Record<string, string> = {
  Action: '#EF4444',      // Red
  Adventure: '#F97316',   // Orange
  Animation: '#8B5CF6',   // Purple
  Comedy: '#FBBF24',      // Yellow
  Crime: '#6B7280',       // Gray
  Documentary: '#14B8A6', // Teal
  Drama: '#F59E0B',       // Amber
  Family: '#EC4899',      // Pink
  Fantasy: '#A855F7',     // Purple
  History: '#92400E',     // Brown
  Horror: '#991B1B',      // Dark red
  Music: '#EC4899',       // Pink
  Mystery: '#6366F1',     // Indigo
  Romance: '#FB7185',     // Coral
  'Sci-Fi': '#06B6D4',    // Cyan
  Thriller: '#1F2937',    // Dark gray
  War: '#78716C',         // Stone
  Western: '#D97706',     // Amber dark
};

export const getGenreColor = (genre: string): string => {
  return genreColors[genre] || colors.primary;
};

// Gradient definitions for LinearGradient
export const gradients = {
  primary: ['#F59E0B', '#D97706'] as const,
  primaryReverse: ['#D97706', '#F59E0B'] as const,
  coral: ['#FB7185', '#F43F5E'] as const,
  dark: ['rgba(10, 10, 11, 0)', 'rgba(10, 10, 11, 1)'] as const,
  darkReverse: ['rgba(10, 10, 11, 1)', 'rgba(10, 10, 11, 0)'] as const,
  surface: ['#1A1A1D', '#151518'] as const,
  hero: ['rgba(10, 10, 11, 0)', 'rgba(10, 10, 11, 0.6)', 'rgba(10, 10, 11, 1)'] as const,
};

// Taste titles based on top genre
export const getTasteTitle = (genre: string): { title: string; description: string } => {
  const tasteTitles: Record<string, { title: string; description: string }> = {
    'Action': { title: 'ACTION AFICIONADO', description: 'with a passion for high-octane thrills' },
    'Comedy': { title: 'COMEDY CONNOISSEUR', description: 'always chasing the perfect laugh' },
    'Drama': { title: 'DRAMA DEVOTEE', description: 'drawn to powerful storytelling' },
    'Horror': { title: 'HORROR ENTHUSIAST', description: 'fearlessly exploring the dark side' },
    'Science Fiction': { title: 'SCI-FI EXPLORER', description: 'voyaging through infinite possibilities' },
    'Sci-Fi': { title: 'SCI-FI EXPLORER', description: 'voyaging through infinite possibilities' },
    'Romance': { title: 'ROMANCE ROMANTIC', description: 'believing in the power of love stories' },
    'Thriller': { title: 'THRILLER SEEKER', description: 'addicted to suspense and tension' },
    'Animation': { title: 'ANIMATION ADMIRER', description: 'appreciating the art of motion' },
    'Documentary': { title: 'DOCUMENTARY BUFF', description: 'hungry for real-world stories' },
    'Adventure': { title: 'ADVENTURE SEEKER', description: 'always ready for the next journey' },
    'Fantasy': { title: 'FANTASY DREAMER', description: 'escaping into magical worlds' },
    'Crime': { title: 'CRIME INVESTIGATOR', description: 'solving mysteries one film at a time' },
    'Mystery': { title: 'MYSTERY MAVEN', description: 'piecing together every clue' },
  };
  return tasteTitles[genre] || { title: 'FILM ENTHUSIAST', description: 'with eclectic taste in cinema' };
};

// Rating tendency description
export const getRatingTendency = (avgScore: number): string => {
  if (avgScore >= 80) return "You're a generous rater who finds the good in films";
  if (avgScore >= 65) return "You have balanced taste and fair standards";
  if (avgScore >= 50) return "You're a discerning viewer with high standards";
  return "You're a tough critic who demands excellence";
};

// Genre icons for Ionicons
export const genreIcons: Record<string, string> = {
  'Action': 'flash',
  'Adventure': 'compass',
  'Animation': 'color-palette',
  'Comedy': 'happy',
  'Crime': 'skull',
  'Documentary': 'videocam',
  'Drama': 'heart',
  'Family': 'people',
  'Fantasy': 'sparkles',
  'History': 'time',
  'Horror': 'skull-outline',
  'Music': 'musical-notes',
  'Mystery': 'search',
  'Romance': 'heart-circle',
  'Science Fiction': 'planet',
  'Sci-Fi': 'planet',
  'Thriller': 'alert-circle',
  'War': 'shield',
  'Western': 'sunny',
};

export const getGenreIcon = (genre: string): string => {
  return genreIcons[genre] || 'star';
};
