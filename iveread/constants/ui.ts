export const Palette = {
  background: '#FAFAF8',
  surface: '#FFFFFF',
  textPrimary: '#1F1F1D',
  textSecondary: '#3E3C38',
  textTertiary: '#6F6A64',
  accent: '#7FB3D6',
  accentSoft: '#EEF4F8',
  border: '#E4E0DB',
  shadow: '#C7C2BC',
};

export const Typography = {
  title: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: Palette.textPrimary,
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 14,
    color: Palette.textSecondary,
    letterSpacing: 0.2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Palette.textPrimary,
  },
  body: {
    fontSize: 14,
    color: Palette.textSecondary,
    lineHeight: 19,
  },
  caption: {
    fontSize: 12,
    color: Palette.textTertiary,
  },
};

export const Shadows = {
  card: {
    shadowColor: Palette.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 2,
  },
};
