export const theme = {
  colors: {
    primary: '#f04299',
    backgroundLight: '#f8f6f7',
    backgroundDark: '#221019',
    textLight: '#181114',
    textDark: '#f8f6f7',
    borderLight: '#f4f0f2',
    borderDark: '#3c2a33',
    cardLight: '#ffffff',
    cardDark: '#2a151f',
    mutedLight: '#896175',
    mutedDark: '#a18c96',
  },
  fonts: {
    display: 'Plus Jakarta Sans',
    // Mood-based font families using Expo Google Fonts
    moodFonts: {
      romantic: 'Playfair Display',
      adventurous: 'Cinzel',
      fun: 'Fredoka',
      relaxed: 'Quicksand',
      // Fallbacks for other categories
      food: 'Plus Jakarta Sans',
      nature: 'Plus Jakarta Sans',
      culture: 'Plus Jakarta Sans',
      sport: 'Plus Jakarta Sans',
    },
    sizes: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
      '4xl': 36,
    },
    weights: {
      normal: '400',
      medium: '500',
      bold: '700',
      extrabold: '800',
    },
    // Styles typographiques spécifiques pour chaque mood des cartes de swipe
    moodStyles: {
      romantic: {
        titleWeight: '300' as any, // Plus léger et élégant
        titleStyle: 'italic' as any,
        titleLetterSpacing: 0.5,
        subtitleWeight: '400' as any,
        subtitleStyle: 'normal' as any,
        subtitleLetterSpacing: 0.3,
      },
      adventurous: {
        titleWeight: '800' as any, // Très bold pour l'aventure
        titleStyle: 'normal' as any,
        titleLetterSpacing: 1.2,
        subtitleWeight: '600' as any,
        subtitleStyle: 'normal' as any,
        subtitleLetterSpacing: 0.8,
      },
      fun: {
        titleWeight: '700' as any, // Bold et joyeux
        titleStyle: 'normal' as any,
        titleLetterSpacing: -0.2,
        subtitleWeight: '500' as any,
        subtitleStyle: 'normal' as any,
        subtitleLetterSpacing: 0.1,
      },
      relaxed: {
        titleWeight: '400' as any, // Léger et apaisant
        titleStyle: 'normal' as any,
        titleLetterSpacing: 0.8,
        subtitleWeight: '300' as any,
        subtitleStyle: 'normal' as any,
        subtitleLetterSpacing: 0.5,
      },
      // Styles pour les autres catégories
      food: {
        titleWeight: '600' as any,
        titleStyle: 'normal' as any,
        titleLetterSpacing: 0.2,
        subtitleWeight: '400' as any,
        subtitleStyle: 'normal' as any,
        subtitleLetterSpacing: 0.2,
      },
      nature: {
        titleWeight: '500' as any,
        titleStyle: 'normal' as any,
        titleLetterSpacing: 0.4,
        subtitleWeight: '400' as any,
        subtitleStyle: 'normal' as any,
        subtitleLetterSpacing: 0.3,
      },
      culture: {
        titleWeight: '600' as any,
        titleStyle: 'normal' as any,
        titleLetterSpacing: 0.6,
        subtitleWeight: '400' as any,
        subtitleStyle: 'normal' as any,
        subtitleLetterSpacing: 0.4,
      },
      sport: {
        titleWeight: '700' as any,
        titleStyle: 'normal' as any,
        titleLetterSpacing: 0.1,
        subtitleWeight: '500' as any,
        subtitleStyle: 'normal' as any,
        subtitleLetterSpacing: 0.2,
      },
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
  },
  borderRadius: {
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    full: 9999,
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.18,
      shadowRadius: 1.0,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.30,
      shadowRadius: 4.65,
      elevation: 8,
    },
  },
};

export type Theme = typeof theme;