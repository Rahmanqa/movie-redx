import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | REDX CINEMA',
  description: 'Terms of Service for REDX CINEMA.',
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6 text-xs sm:text-sm text-zinc-300 leading-relaxed">
      <h1 className="text-3xl font-black text-white border-b border-zinc-800 pb-4">Terms of Service</h1>
      <p>
        By accessing or using the REDX CINEMA streaming service, you agree to be bound by these Terms of Service.
      </p>

      <h2 className="text-base font-bold text-white pt-2">1. Permitted Use</h2>
      <p>
        REDX CINEMA is intended for personal, non-commercial entertainment. You may not attempt to circumvent video stream
        protections, rip, download, or re-distribute content unlawfully.
      </p>

      <h2 className="text-base font-bold text-white pt-2">2. Content Licensing</h2>
      <p>
        All media displayed on REDX CINEMA is subject to copyright held by its respective creators and distributors.
        We stream only authorized public domain, Creative Commons, and licensed materials.
      </p>

      <h2 className="text-base font-bold text-white pt-2">3. Disclaimer</h2>
      <p>
        The services are provided &quot;as is&quot; without warranties of any kind regarding stream availability or uninterrupted playback.
      </p>
    </div>
  );
}
