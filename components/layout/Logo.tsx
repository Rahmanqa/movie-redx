import Link from 'next/link';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function Logo({ className = '', size = 'md' }: LogoProps) {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  return (
    <Link href="/" className={`inline-flex items-center gap-2.5 group select-none ${className}`}>
      {/* Original REDX Cinema Emblem */}
      <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-red-600 via-brand-primary to-black border border-red-500/30 shadow-glow-sm group-hover:shadow-glow-md transition-all duration-300">
        {/* Film Reel Cross 'X' */}
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
          <path d="M4 4h4l4 4-4 4H4l4-4-4-4zm12 0h4l-4 4 4 4h-4l-4-4 4-4zm-4 8l4 4h-4l-4-4 4-4v4zm0 0l-4 4H4l4-4-4-4h4l4 4z" opacity="0.3"/>
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 14H6l5-5-5-5h12l-5 5 5 5z" fill="#ff2b38"/>
        </svg>
      </div>

      <div className="flex flex-col">
        <div className={`font-black tracking-wider uppercase ${sizeClasses[size]}`}>
          <span className="text-white font-extrabold">RED</span>
          <span className="text-brand-primary font-black drop-shadow-[0_0_8px_rgba(229,9,20,0.6)]">X</span>
          <span className="text-gray-300 font-light text-xs sm:text-sm tracking-widest ml-1.5 uppercase">CINEMA</span>
        </div>
        <span className="text-[9px] tracking-widest text-zinc-400 font-medium uppercase -mt-1 hidden sm:block">
          Dual Audio • HD & 4K
        </span>
      </div>
    </Link>
  );
}
