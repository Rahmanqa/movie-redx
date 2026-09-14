import { Shield, Mail } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'DMCA & Copyright Policy | REDX CINEMA',
  description: 'DMCA and Copyright compliance statement for REDX CINEMA.',
};

export default function DmcaPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-red-500">
          <Shield className="w-4 h-4" />
          <span>Legal Compliance</span>
        </div>
        <h1 className="text-3xl font-black text-white mt-1">DMCA & Copyright Policy</h1>
        <p className="text-xs text-zinc-400 mt-1">Last updated: 2025</p>
      </div>

      <div className="space-y-6 text-xs sm:text-sm text-zinc-300 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">1. Strict Anti-Piracy Commitment</h2>
          <p>
            REDX CINEMA respects the intellectual property rights of others and expects its users and partners to do the same.
            It is our policy to strictly stream legally authorized, public-domain, Creative Commons, and licensed materials.
            We do not host or promote unauthorized copyrighted movies or pirated streams.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">2. DMCA Takedown Procedure</h2>
          <p>
            If you believe that your copyrighted work has been copied or linked in a way that constitutes copyright infringement,
            please send a notice containing the following information to our Designated Copyright Agent:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-zinc-400">
            <li>A physical or electronic signature of the copyright owner or authorized representative.</li>
            <li>Identification of the copyrighted work claimed to have been infringed.</li>
            <li>Identification of the material that is claimed to be infringing and its exact URL on REDX CINEMA.</li>
            <li>Your contact information, including name, address, phone number, and email.</li>
            <li>A statement by you having a good faith belief that the disputed use is not authorized by the copyright owner.</li>
            <li>A statement made under penalty of perjury that the information in your notice is accurate.</li>
          </ul>
        </section>

        <section className="space-y-2 bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Mail className="w-4 h-4 text-red-400" />
            <span>Designated Copyright Agent Contact</span>
          </h3>
          <p className="text-xs text-zinc-400">
            Email: <a href="mailto:dmca@redxcinema.com" className="text-brand-primary underline">dmca@redxcinema.com</a>
          </p>
          <p className="text-[11px] text-zinc-500">
            Upon receipt of a valid notice, we will act promptly to remove or disable access to the infringing material.
          </p>
        </section>
      </div>
    </div>
  );
}
