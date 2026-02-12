export const theme = {
  colors: {
    primary: '#1DB954', // Spotify green
    background: '#121212', // Dark background
    surface: '#282828', // Slightly lighter background
    text: '#FFFFFF',
    textSecondary: '#B3B3B3',
    accent: '#1ED760', // Brighter green for accents
    error: '#E91429',
    success: '#1DB954',
    card: '#185818',
    border: '#333333',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 16,
    xl: 24,
  },
  typography: {
    h1: {
      fontSize: 32,
      fontWeight: '700' as const,
    },
    h2: {
      fontSize: 24,
      fontWeight: '700' as const,
    },
    h3: {
      fontSize: 20,
      fontWeight: '600' as const,
    },
    body: {
      fontSize: 16,
    },
    caption: {
      fontSize: 14,
      color: '#B3B3B3',
    },
  },
}; 