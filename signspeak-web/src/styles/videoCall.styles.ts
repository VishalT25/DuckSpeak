/**
 * Revolutionary Design System for DuckSpeak
 * Ultramarine Blue Theme
 */

export const colors = {
  // Primary gradient colors - Ultramarine blue spectrum
  primary: {
    start: '#1e3a8a', // Deep blue
    mid: '#3b82f6',   // Bright blue
    end: '#60a5fa',   // Light blue
  },
  // Secondary gradient colors - Royal to sky blue
  secondary: {
    start: '#1e40af', // Royal blue
    mid: '#2563eb',   // Blue
    end: '#3b82f6',   // Bright blue
  },
  // Accent colors
  accent: {
    blue: '#0ea5e9',
    sky: '#38bdf8',
    indigo: '#6366f1',
  },
  // Neutral colors
  dark: {
    900: '#0a0e1a',
    800: '#0f172a',
    700: '#1e293b',
    600: '#334155',
  },
  light: {
    100: '#f0f9ff',
    200: '#e0f2fe',
    300: '#bae6fd',
  },
};

export const gradients = {
  primary: `linear-gradient(135deg, ${colors.primary.start} 0%, ${colors.primary.mid} 50%, ${colors.primary.end} 100%)`,
  secondary: `linear-gradient(135deg, ${colors.secondary.start} 0%, ${colors.secondary.mid} 50%, ${colors.secondary.end} 100%)`,
  background: `linear-gradient(135deg, ${colors.dark[900]} 0%, ${colors.dark[800]} 50%, #0a1628 100%)`,
  mesh: `
    radial-gradient(at 0% 0%, ${colors.primary.start}15 0px, transparent 50%),
    radial-gradient(at 100% 0%, ${colors.primary.end}10 0px, transparent 50%),
    radial-gradient(at 100% 100%, ${colors.secondary.mid}15 0px, transparent 50%),
    radial-gradient(at 0% 100%, ${colors.secondary.start}10 0px, transparent 50%)
  `,
};

export const typography = {
  fontFamily: {
    primary: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    display: "'Space Grotesk', 'Inter', sans-serif",
    mono: "'JetBrains Mono', 'Courier New', monospace",
  },
};

export const shadows = {
  sm: '0 2px 8px rgba(30, 58, 138, 0.1)',
  md: '0 8px 24px rgba(30, 58, 138, 0.15)',
  lg: '0 16px 48px rgba(30, 58, 138, 0.2)',
  xl: '0 24px 64px rgba(30, 58, 138, 0.25)',
  glow: '0 0 40px rgba(59, 130, 246, 0.4), 0 0 80px rgba(59, 130, 246, 0.2)',
  glowCyan: '0 0 40px rgba(14, 165, 233, 0.4), 0 0 80px rgba(14, 165, 233, 0.2)',
};

export const styles = {
  // Join screen styles
  joinContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: colors.dark[900],
    backgroundImage: gradients.mesh,
    padding: '20px',
    fontFamily: typography.fontFamily.primary,
  } as const,

  joinCard: {
    maxWidth: '540px',
    width: '100%',
    padding: '60px 50px',
    background: `linear-gradient(135deg, ${colors.dark[800]}dd 0%, ${colors.dark[700]}cc 100%)`,
    backdropFilter: 'blur(20px) saturate(180%)',
    borderRadius: '32px',
    border: `1px solid ${colors.primary.start}30`,
    boxShadow: shadows.xl,
    position: 'relative' as const,
    overflow: 'hidden',
  } as const,

  joinCardGlow: {
    position: 'absolute' as const,
    top: '-50%',
    left: '-50%',
    width: '200%',
    height: '200%',
    background: gradients.primary,
    opacity: 0.03,
    filter: 'blur(60px)',
    pointerEvents: 'none' as const,
  } as const,

  titleGlow: {
    textAlign: 'center' as const,
    marginBottom: '48px',
    position: 'relative' as const,
    zIndex: 1,
  } as const,

  title: {
    fontSize: '64px',
    fontWeight: 800,
    fontFamily: typography.fontFamily.display,
    background: gradients.primary,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    marginBottom: '12px',
    letterSpacing: '-0.02em',
    lineHeight: 1.1,
  } as const,

  tagline: {
    fontSize: '18px',
    color: colors.light[300],
    opacity: 0.8,
    fontWeight: 400,
    letterSpacing: '0.01em',
  } as const,

  inputGroup: {
    marginBottom: '28px',
    position: 'relative' as const,
    zIndex: 1,
  } as const,

  label: {
    display: 'block',
    fontSize: '15px',
    fontWeight: 600,
    color: colors.light[200],
    marginBottom: '10px',
    letterSpacing: '0.01em',
  } as const,

  input: {
    width: '100%',
    padding: '16px 20px',
    fontSize: '16px',
    background: `${colors.dark[700]}80`,
    color: colors.light[100],
    border: `2px solid ${colors.dark[600]}`,
    borderRadius: '16px',
    outline: 'none',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    fontFamily: typography.fontFamily.primary,
  } as const,

  inputFocus: {
    borderColor: colors.primary.start,
    background: `${colors.dark[700]}cc`,
    boxShadow: `0 0 0 4px ${colors.primary.start}20`,
  } as const,

  hint: {
    fontSize: '13px',
    color: colors.light[300],
    marginTop: '10px',
    opacity: 0.7,
  } as const,

  button: {
    padding: '18px 36px',
    fontSize: '17px',
    fontWeight: 600,
    border: 'none',
    borderRadius: '16px',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    letterSpacing: '0.01em',
    fontFamily: typography.fontFamily.primary,
    position: 'relative' as const,
    overflow: 'hidden',
  } as const,

  joinButton: {
    width: '100%',
    background: gradients.primary,
    color: '#fff',
    boxShadow: shadows.glow,
    fontWeight: 700,
  } as const,

  joinButtonHover: {
    transform: 'translateY(-2px)',
    boxShadow: `${shadows.glow}, 0 12px 32px rgba(99, 102, 241, 0.3)`,
  } as const,

  buttonDisabled: {
    background: colors.dark[600],
    color: colors.light[300],
    cursor: 'not-allowed',
    boxShadow: 'none',
    opacity: 0.5,
  } as const,

  error: {
    marginTop: '24px',
    padding: '16px 20px',
    background: `${colors.accent.sky}15`,
    border: `1px solid ${colors.accent.sky}40`,
    borderRadius: '16px',
    color: colors.accent.sky,
    fontSize: '15px',
    fontWeight: 500,
  } as const,

  warning: {
    marginTop: '24px',
    padding: '16px 20px',
    background: `${colors.accent.blue}15`,
    border: `1px solid ${colors.accent.blue}40`,
    borderRadius: '16px',
    color: colors.accent.blue,
    fontSize: '15px',
    fontWeight: 500,
  } as const,

  features: {
    marginTop: '48px',
    padding: '28px',
    background: `${colors.primary.start}08`,
    borderRadius: '20px',
    border: `1px solid ${colors.primary.start}15`,
  } as const,

  featuresTitle: {
    fontSize: '20px',
    fontWeight: 700,
    color: colors.light[100],
    marginBottom: '20px',
    fontFamily: typography.fontFamily.display,
  } as const,

  featuresList: {
    listStyle: 'none',
    padding: 0,
    color: colors.light[300],
    lineHeight: 2,
    fontSize: '15px',
  } as const,

  // Call screen styles
  callContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100vh',
    background: colors.dark[900],
    backgroundImage: gradients.mesh,
    color: colors.light[100],
    overflow: 'hidden',
    fontFamily: typography.fontFamily.primary,
  } as const,

  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 32px',
    background: `${colors.dark[800]}dd`,
    backdropFilter: 'blur(20px) saturate(180%)',
    borderBottom: `1px solid ${colors.primary.start}20`,
    zIndex: 100,
    position: 'relative' as const,
  } as const,

  headerGlow: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    height: '100%',
    background: gradients.primary,
    opacity: 0.02,
    pointerEvents: 'none' as const,
  } as const,

  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
    position: 'relative' as const,
    zIndex: 1,
  } as const,

  headerTitle: {
    fontSize: '28px',
    fontWeight: 800,
    fontFamily: typography.fontFamily.display,
    background: gradients.primary,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    letterSpacing: '-0.01em',
  } as const,

  statusBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 20px',
    background: `${colors.secondary.start}15`,
    borderRadius: '24px',
    fontSize: '15px',
    color: colors.secondary.start,
    fontWeight: 600,
    border: `1px solid ${colors.secondary.start}30`,
  } as const,

  statusDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    background: colors.secondary.start,
    boxShadow: `0 0 16px ${colors.secondary.start}`,
    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  } as const,

  roomCodeBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 16px',
    background: `${colors.primary.mid}12`,
    borderRadius: '24px',
    fontSize: '14px',
    fontFamily: typography.fontFamily.mono,
    border: `1px solid ${colors.primary.mid}25`,
  } as const,

  roomCodeText: {
    color: colors.primary.mid,
    fontWeight: 600,
    letterSpacing: '0.5px',
  } as const,

  roomCodeCopyBtn: {
    border: 'none',
    background: 'transparent',
    color: colors.primary.mid,
    fontSize: '18px',
    cursor: 'pointer',
    padding: '4px 6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    borderRadius: '8px',
  } as const,

  roomCodeCopyBtnHover: {
    background: `${colors.primary.mid}20`,
  } as const,

  headerControls: {
    display: 'flex',
    gap: '14px',
    position: 'relative' as const,
    zIndex: 1,
  } as const,

  controlBtn: {
    width: '52px',
    height: '52px',
    borderRadius: '16px',
    background: `${colors.dark[700]}cc`,
    color: colors.light[100],
    fontSize: '22px',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: `1px solid ${colors.dark[600]}`,
    backdropFilter: 'blur(10px)',
  } as const,

  controlBtnHover: {
    background: `${colors.dark[600]}dd`,
    transform: 'translateY(-2px)',
    boxShadow: shadows.md,
  } as const,

  controlBtnMuted: {
    background: `${colors.accent.sky}20`,
    color: colors.accent.sky,
    border: `1px solid ${colors.accent.sky}40`,
  } as const,

  controlBtnActive: {
    background: gradients.primary,
    color: '#fff',
    boxShadow: shadows.glow,
  } as const,

  mixerContainer: {
    position: 'relative' as const,
  } as const,

  dropdownMenu: {
    position: 'absolute' as const,
    top: '60px',
    right: '0',
    minWidth: '280px',
    background: `${colors.dark[700]}f5`,
    backdropFilter: 'blur(20px) saturate(180%)',
    border: `1px solid ${colors.primary.start}30`,
    borderRadius: '20px',
    padding: '12px',
    boxShadow: shadows.xl,
    zIndex: 1000,
  } as const,

  dropdownHeader: {
    padding: '12px 16px',
    fontSize: '13px',
    fontWeight: 700,
    color: colors.primary.end,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  } as const,

  dropdownItem: {
    width: '100%',
    padding: '12px 16px',
    border: 'none',
    background: 'transparent',
    color: colors.light[200],
    fontSize: '15px',
    textAlign: 'left' as const,
    cursor: 'pointer',
    borderRadius: '12px',
    transition: 'all 0.2s ease',
    display: 'block',
    fontWeight: 500,
  } as const,

  dropdownItemHover: {
    background: `${colors.primary.start}15`,
    color: colors.light[100],
  } as const,

  dropdownItemSelected: {
    background: `${colors.primary.start}25`,
    color: colors.primary.end,
    fontWeight: 600,
  } as const,

  dropdownItemDisabled: {
    opacity: 0.4,
  } as const,

  dropdownDivider: {
    height: '1px',
    background: `${colors.dark[600]}80`,
    margin: '10px 0',
  } as const,

  leaveBtn: {
    padding: '14px 28px',
    border: 'none',
    borderRadius: '16px',
    background: `${colors.accent.blue}`,
    color: '#fff',
    fontSize: '15px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  } as const,

  leaveBtnHover: {
    background: `${colors.accent.blue}dd`,
    transform: 'translateY(-2px)',
    boxShadow: `0 0 24px ${colors.accent.blue}40`,
  } as const,

  errorBanner: {
    padding: '16px 32px',
    background: `${colors.accent.sky}15`,
    borderBottom: `1px solid ${colors.accent.sky}30`,
    color: colors.accent.sky,
    fontSize: '15px',
    fontWeight: 500,
  } as const,

  infoBanner: {
    padding: '16px 32px',
    background: `${colors.secondary.start}15`,
    borderBottom: `1px solid ${colors.secondary.start}30`,
    color: colors.secondary.start,
    fontSize: '15px',
    fontWeight: 500,
  } as const,

  successBanner: {
    padding: '16px 32px',
    background: `${colors.secondary.end}15`,
    borderBottom: `1px solid ${colors.secondary.end}30`,
    color: colors.secondary.end,
    fontSize: '15px',
    fontWeight: 500,
  } as const,

  videoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
    gap: '32px',
    padding: '32px',
    flex: 1,
    overflow: 'auto',
    alignContent: 'start',
  } as const,

  videoCard: {
    position: 'relative' as const,
    borderRadius: '28px',
    background: colors.dark[800],
    border: `2px solid ${colors.primary.start}20`,
    boxShadow: shadows.lg,
    overflow: 'hidden',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  } as const,

  videoCardHover: {
    transform: 'translateY(-4px)',
    boxShadow: shadows.xl,
    border: `2px solid ${colors.primary.start}40`,
  } as const,

  videoContainer: {
    position: 'relative' as const,
    width: '100%',
    paddingBottom: '75%',
    background: colors.dark[900],
  } as const,

  hiddenProcessingVideo: {
    position: 'absolute' as const,
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
    opacity: 0,
    pointerEvents: 'none' as const,
    zIndex: 1,
  } as const,

  video: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
    backgroundColor: colors.dark[900],
    willChange: 'transform',
    backfaceVisibility: 'hidden' as const,
    WebkitBackfaceVisibility: 'hidden',
    zIndex: 2,
  } as const,

  videoLabel: {
    position: 'absolute' as const,
    top: '20px',
    left: '20px',
    padding: '10px 18px',
    background: `${colors.dark[800]}dd`,
    backdropFilter: 'blur(10px)',
    borderRadius: '14px',
    color: colors.light[100],
    fontSize: '15px',
    fontWeight: 600,
    zIndex: 10,
    border: `1px solid ${colors.dark[600]}`,
  } as const,

  listeningIndicator: {
    position: 'absolute' as const,
    top: '20px',
    right: '20px',
    padding: '10px 18px',
    background: `${colors.secondary.start}25`,
    backdropFilter: 'blur(10px)',
    borderRadius: '14px',
    color: colors.secondary.start,
    fontSize: '15px',
    fontWeight: 600,
    zIndex: 10,
    border: `1px solid ${colors.secondary.start}40`,
    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  } as const,

  signModeIndicator: {
    position: 'absolute' as const,
    bottom: '80px',
    right: '20px',
    padding: '10px 18px',
    background: `${colors.primary.mid}25`,
    backdropFilter: 'blur(10px)',
    borderRadius: '14px',
    color: colors.primary.mid,
    fontSize: '15px',
    fontWeight: 600,
    zIndex: 10,
    border: `1px solid ${colors.primary.mid}40`,
  } as const,

  captionsOverlay: {
    position: 'absolute' as const,
    bottom: '20px',
    left: '20px',
    right: '20px',
    maxHeight: '180px',
    overflowY: 'auto' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
    zIndex: 20,
    pointerEvents: 'none' as const,
  } as const,

  captionLine: {
    padding: '12px 18px',
    background: `${colors.dark[800]}f0`,
    backdropFilter: 'blur(20px) saturate(180%)',
    borderRadius: '14px',
    color: colors.light[100],
    fontSize: '16px',
    fontWeight: 500,
    lineHeight: 1.5,
    border: `1px solid ${colors.dark[700]}`,
    boxShadow: shadows.md,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  } as const,

  waitingOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: `${colors.dark[900]}cc`,
    backdropFilter: 'blur(10px)',
    zIndex: 5,
  } as const,

  waitingText: {
    textAlign: 'center' as const,
    color: colors.light[200],
    fontSize: '18px',
    fontWeight: 500,
  } as const,

  spinner: {
    width: '48px',
    height: '48px',
    border: `4px solid ${colors.dark[700]}`,
    borderTop: `4px solid ${colors.primary.start}`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 20px',
  } as const,

  shareButton: {
    marginTop: '24px',
    padding: '14px 28px',
    background: gradients.primary,
    color: '#fff',
    border: 'none',
    borderRadius: '14px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: shadows.glow,
  } as const,

  shareButtonHover: {
    transform: 'translateY(-2px)',
    boxShadow: `${shadows.glow}, 0 8px 20px ${colors.primary.start}30`,
  } as const,

  // Legacy caption box styles (can be removed if not needed)
  captionTextBox: {
    padding: '16px',
    background: `${colors.dark[800]}dd`,
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    border: `1px solid ${colors.dark[700]}`,
  } as const,

  captionTextBoxHeader: {
    fontSize: '14px',
    fontWeight: 600,
    color: colors.light[300],
    marginBottom: '12px',
  } as const,

  captionTextBoxContent: {
    fontSize: '15px',
    color: colors.light[100],
  } as const,

  captionTextLine: {
    padding: '8px 0',
    borderBottom: `1px solid ${colors.dark[700]}`,
  } as const,

  captionIcon: {
    marginRight: '8px',
  } as const,

  captionTextEmpty: {
    padding: '12px',
    textAlign: 'center' as const,
    color: colors.light[300],
    opacity: 0.6,
  } as const,

  speechModeIndicator: {
    position: 'absolute' as const,
    bottom: '80px',
    left: '20px',
    padding: '10px 18px',
    background: `${colors.secondary.start}25`,
    backdropFilter: 'blur(10px)',
    borderRadius: '14px',
    color: colors.secondary.start,
    fontSize: '15px',
    fontWeight: 600,
    zIndex: 10,
    border: `1px solid ${colors.secondary.start}40`,
  } as const,
};

export default styles;
