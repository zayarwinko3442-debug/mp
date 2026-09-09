import React, { useState } from 'react';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'icon' | 'full';
  showText?: boolean;
  textClassName?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'icon',
  showText = false,
  textClassName = '',
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  // Size mapping for the logo badge
  const sizeClasses = {
    sm: 'w-8 h-8 rounded-lg p-1',
    md: 'w-10 h-10 sm:w-11 sm:h-11 rounded-xl p-1.5',
    lg: 'w-14 h-14 rounded-2xl p-2',
    xl: 'w-20 h-20 rounded-2xl p-2.5',
  };

  const fullSizeClasses = {
    sm: 'w-24 h-24 p-2',
    md: 'w-32 h-32 p-3',
    lg: 'w-48 h-48 p-4',
    xl: 'w-64 h-64 p-6',
  };

  if (variant === 'full') {
    return (
      <div
        className={`bg-white rounded-2xl shadow-xl border border-zinc-200 flex flex-col items-center justify-center text-center shrink-0 ${fullSizeClasses[size]} ${className}`}
      >
        <img
          src="/logo.svg"
          alt="Mobile Perfect Logo"
          className="w-full h-full object-contain"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = '/logo.png';
          }}
        />
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2.5 shrink-0 ${className}`}>
      {/* High-contrast crisp white badge matching user's uploaded LOgo.jpg */}
      <div
        className={`relative bg-white shadow-md shadow-sky-950/20 border border-zinc-100/90 flex items-center justify-center shrink-0 transition-transform duration-200 hover:scale-105 overflow-hidden ${sizeClasses[size]}`}
      >
        {!imgFailed ? (
          <img
            src="/logo-icon.svg"
            alt="Mobile Perfect"
            className="w-full h-full object-contain"
            onError={() => setImgFailed(true)}
          />
        ) : (
          /* Inline SVG fallback in case browser blocks external asset */
          <svg
            viewBox="0 0 340 220"
            className="w-full h-full"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <polygon points="38,100 86,100 48,185 0,185" fill="#0047cc" />
            <polygon points="86,100 114,100 76,185 48,185" fill="#001a66" />
            <polygon points="114,100 162,15 132,15 76,185" fill="#0055ff" />
            <polygon points="162,15 186,15 142,185 116,185" fill="#00247d" />
            <polygon points="186,15 234,15 166,185 142,185" fill="#0080ff" />
            <polygon points="224,15 316,15 292,72 200,72" fill="#0099ff" />
            <polygon points="316,15 316,28 274,124 232,124 292,72" fill="#24a8ff" />
            <polygon points="274,124 200,124 216,72 258,72" fill="#0080ff" />
          </svg>
        )}
      </div>

      {showText && (
        <div className={`flex flex-col text-left ${textClassName}`}>
          <span className="text-base sm:text-lg font-black tracking-tight text-white leading-none">
            Mobile Perfect
          </span>
          <span className="text-[10px] sm:text-[11px] font-semibold tracking-wider text-sky-400 uppercase mt-0.5">
            Movie & Series Vault
          </span>
        </div>
      )}
    </div>
  );
};
