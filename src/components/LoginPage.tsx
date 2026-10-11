import React, { useState } from 'react';
import { 
  Sparkles, 
  Grid3X3, 
  Printer, 
  CloudCheck, 
  ArrowRight, 
  Lock, 
  CheckCircle2,
  BookOpen
} from 'lucide-react';

interface LoginPageProps {
  onSignInWithGoogle: () => Promise<void>;
  onContinueAsGuest: () => void;
  presetCount: number;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onSignInWithGoogle,
  onContinueAsGuest,
  presetCount
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoogleClick = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await onSignInWithGoogle();
    } catch (err: any) {
      console.error('Login error:', err);
      // If user closed popup, don't show scary error
      if (err?.code !== 'auth/popup-closed-by-user') {
        setErrorMsg('Sign-in failed. Please try again or continue as guest.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col justify-between selection:bg-amber-400 selection:text-stone-950 relative overflow-hidden">
      
      {/* Subtle ambient background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[350px] bg-amber-600/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Top mini navbar */}
      <header className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between border-b border-stone-800/60">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-brand font-bold text-xl shadow-lg">
            CG
          </div>
          <div>
            <span className="font-serif-title text-2xl font-bold tracking-tight text-amber-100">
              Crossgen
            </span>
            <span className="block text-[10px] text-stone-400 font-sans uppercase tracking-widest -mt-1">
              Crossword Studio & Solver
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onContinueAsGuest}
            className="text-xs sm:text-sm text-stone-400 hover:text-stone-200 transition-colors py-1.5 px-3 rounded-lg hover:bg-stone-900"
          >
            Explore as Guest
          </button>
        </div>
      </header>

      {/* Main Hero & Auth Card */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 py-8 sm:py-12 flex-1 flex flex-col items-center justify-center text-center">
        
        {/* Brand Pill */}
        <div className="inline-flex items-center space-x-2 bg-stone-900/90 border border-amber-500/30 px-3.5 py-1.5 rounded-full text-xs font-semibold text-amber-300 mb-6 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Crossgen • Intelligent Crossword Engine</span>
        </div>

        {/* Hero Title */}
        <h1 className="font-serif-title text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-stone-100 max-w-3xl leading-[1.15]">
          Generate, Solve & Print <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200">
            Crossword Puzzles
          </span>
        </h1>

        <p className="mt-4 text-sm sm:text-base md:text-lg text-stone-400 max-w-2xl leading-relaxed">
          Input your answers and questions to generate custom interlocking crossword grids in seconds. 
          Solve interactively with progress auto-synced across devices, or export high-res PDF worksheets and teacher answer keys.
        </p>

        {/* Dedicated Login Card */}
        <div className="mt-8 sm:mt-10 w-full max-w-md bg-stone-900/90 border border-stone-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          <div className="mb-6">
            <h2 className="text-xl font-bold font-serif-title text-amber-100">
              Sign In to Crossgen
            </h2>
            <p className="text-xs text-stone-400 mt-1">
              Sync your crossword solving progress and saved custom puzzles across all your devices with Google OAuth 2.0.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs p-3 rounded-lg text-left">
              {errorMsg}
            </div>
          )}

          {/* Primary Action: Google OAuth Button */}
          <button
            onClick={handleGoogleClick}
            disabled={isLoading}
            className="w-full py-3.5 px-4 bg-white hover:bg-stone-100 disabled:opacity-60 text-stone-900 font-bold rounded-xl text-sm sm:text-base flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl transition-all active:scale-[0.99] border border-stone-200 group"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-stone-900 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.665-5.17 3.665-9.12z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.13C3.27 21.41 7.34 24 12 24z" />
                <path fill="#FBBC05" d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.13z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.27 2.59 1.25 6.58l4.03 3.13c.95-2.83 3.6-4.96 6.72-4.96z" />
              </svg>
            )}
            <span>Continue with Google</span>
            <ArrowRight className="w-4 h-4 text-stone-500 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-800" />
            </div>
            <div className="relative flex justify-center text-[11px] uppercase tracking-wider text-stone-500">
              <span className="bg-stone-900 px-3">or</span>
            </div>
          </div>

          {/* Secondary Action: Guest mode */}
          <button
            onClick={onContinueAsGuest}
            className="w-full py-2.5 px-4 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white rounded-xl text-xs sm:text-sm font-semibold transition-all border border-stone-700/80"
          >
            Continue as Guest (Local Storage)
          </button>

          {/* Trust bullets */}
          <div className="mt-5 pt-4 border-t border-stone-800/80 space-y-2 text-left text-[11px] text-stone-400">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Auto-save progress across phone, tablet & desktop</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Create unlimited custom puzzles in `ANSWER, question` format</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Export print-ready worksheets & keysheets as PDF</span>
            </div>
          </div>

        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl text-left w-full">
          <div className="bg-stone-900/50 border border-stone-800/80 rounded-xl p-4.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-stone-200">Custom Grid Generator</h3>
            <p className="text-xs text-stone-400 mt-1 leading-relaxed">
              Enter pairs like <code className="text-amber-300">APPLE, a red fruit; BANANA, a yellow fruit</code>. Crossgen builds interlocking layouts automatically.
            </p>
          </div>

          <div className="bg-stone-900/50 border border-stone-800/80 rounded-xl p-4.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
              <CloudCheck className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-stone-200">Google OAuth 2.0 Sync</h3>
            <p className="text-xs text-stone-400 mt-1 leading-relaxed">
              Sign in once to save your unfinished progress in the cloud. Pick up solving on any device right where you left off.
            </p>
          </div>

          <div className="bg-stone-900/50 border border-stone-800/80 rounded-xl p-4.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center mb-3">
              <Printer className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-stone-200">Printable Worksheets & PDF</h3>
            <p className="text-xs text-stone-400 mt-1 leading-relaxed">
              Print student solving worksheets with generous handwriting grids, or export official teacher keysheets with solution answers.
            </p>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="relative z-10 py-5 text-center text-xs text-stone-500 border-t border-stone-900">
        <p>Crossgen • Built for puzzle makers, educators, and crossword enthusiasts</p>
      </footer>

    </div>
  );
};
