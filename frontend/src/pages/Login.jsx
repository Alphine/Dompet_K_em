import { Mascot } from "@/components/Mascot";

export default function Login() {
  const handleGoogleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + "/dashboard";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen bg-kem-navy relative overflow-hidden flex items-center justify-center px-6">
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-kem-teal/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-kem-gold/10 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-md text-center">
        <div className="flex justify-center mb-2">
          <Mascot expression="happy" className="w-36 h-36 drop-shadow-2xl" />
        </div>
        <h1 className="font-heading text-4xl font-extrabold text-white tracking-tight">Dompet K-eM</h1>
        <p className="text-white/60 text-sm mt-1 mb-8">Keuangan yang Mudah</p>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm">
          <p className="text-white text-lg font-heading font-semibold leading-snug">
            Catat gampang. Tahu untung.<br /> Kendalikan usaha.
          </p>
          <p className="text-white/50 text-sm mt-3 mb-8">
            Copilot keuangan AI untuk UMKM Indonesia. Tanpa perlu jadi akuntan.
          </p>

          <button
            data-testid="google-login-button"
            onClick={handleGoogleLogin}
            className="w-full bg-white hover:bg-white/90 text-kem-navy font-semibold rounded-full py-3.5 flex items-center justify-center gap-3 transition-transform active:scale-95 shadow-lg"
          >
            <svg width="20" height="20" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
              <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
              <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
              <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l6.19 5.238C40.205 35.836 44 30.5 44 24c0-1.341-.138-2.65-.389-3.917z" />
            </svg>
            Masuk dengan Google
          </button>
        </div>
        <p className="text-white/30 text-xs mt-6">Bahasa Indonesia · IDR · Untuk UMKM</p>
      </div>
    </div>
  );
}
