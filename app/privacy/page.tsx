import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | REDX CINEMA',
  description: 'Privacy Policy for REDX CINEMA.',
};

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6 text-xs sm:text-sm text-zinc-300 leading-relaxed">
      <h1 className="text-3xl font-black text-white border-b border-zinc-800 pb-4">Privacy Policy</h1>
      <p>
        Your privacy is important to us. This Privacy Policy describes our policies and procedures on the collection,
        use, and disclosure of your information when you use the REDX CINEMA platform.
      </p>

      <h2 className="text-base font-bold text-white pt-2">1. Information We Collect</h2>
      <p>
        When you create an account, save movies to your watchlist, or record watch history, we collect minimal data
        necessary to store your preferences (such as preferred audio language and subtitle tracks).
      </p>

      <h2 className="text-base font-bold text-white pt-2">2. Cookies and Storage</h2>
      <p>
        We use local storage and essential session cookies to remember your playback position (continue watching)
        and audio language preference (English/Hindi).
      </p>

      <h2 className="text-base font-bold text-white pt-2">3. Third-Party Services</h2>
      <p>
        Metadata is powered by TMDB API. We do not sell or trade your personal information with outside parties.
      </p>
    </div>
  );
}
