import React from 'react';

interface TandemLogoProps {
  className?: string;
  size?: number | string;
  showText?: boolean;
  variant?: 'badge' | 'flat';
}

/**
 * TandemLogo - Logo Bande Dessinée (BD) franco-norvégien
 * Reprend la DA BD avec deux bulles de dialogue qui se répondent :
 * - Une bulle bleue royale pour le français (FR) avec queue de bulle à gauche et reflet BD
 * - Une bulle rouge vif pour le norsk (NO) avec queue de bulle à droite et reflet BD
 * - Tracés nets style bande dessinée (outline BD sombre, étincelle de connexion)
 */
export const TandemLogo: React.FC<TandemLogoProps> = ({
  className = 'w-9 h-9',
  size,
  showText = false,
  variant = 'badge',
}) => {
  const icon = (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={size ? undefined : className}
      style={size ? { width: size, height: size } : undefined}
      role="img"
      aria-label="Logo Tandem : bulles BD française et norvégienne"
    >
      {/* Ombre portée BD stylisée (décalage pop BD) */}
      <g opacity="0.18">
        {/* Ombre bulle bleue */}
        <path
          d="M 27 19 C 17 19 12 25 12 36 C 12 45 17 51 27 51 L 28 51 L 18 67 L 36 51 L 53 51 C 63 51 68 45 68 36 C 68 25 63 19 53 19 Z"
          fill="#0F172A"
          transform="translate(2, 2.5)"
        />
        {/* Ombre bulle rouge */}
        <path
          d="M 51 37 C 41 37 36 43 36 54 C 36 63 41 69 51 69 L 66 69 L 80 83 L 73 69 L 77 69 C 87 69 92 63 92 54 C 92 43 87 37 77 37 Z"
          fill="#0F172A"
          transform="translate(2, 2.5)"
        />
      </g>

      {/* --- BULLE 1 : FRANÇAIS (BLEUE ROYALE BD) --- */}
      <g id="bulle-fr">
        {/* Corps bulle bleue */}
        <path
          d="M 27 18 C 17 18 11 24 11 35 C 11 44 17 50 27 50 L 29 50 L 19 66 L 37 50 L 53 50 C 63 50 69 44 69 35 C 69 24 63 18 53 18 Z"
          fill="#1E56B3"
          stroke="#111827"
          strokeWidth="3.2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Dégradé doux / lueur interne BD */}
        <path
          d="M 27 20 C 19 20 13.5 25 13.5 35 C 13.5 37 14 39 15 41 C 18 27 30 21 51 21 C 52 20.3 47 20 27 20 Z"
          fill="#3B82F6"
          opacity="0.55"
        />

        {/* Reflet blanc courbé typique de la BD franco-belge */}
        <path
          d="M 18 26 C 21 21.5 28 20 38 20"
          stroke="#FFFFFF"
          strokeWidth="2.8"
          strokeLinecap="round"
          opacity="0.8"
        />

        {/* Petit point de brillance BD */}
        <circle cx="16" cy="30" r="1.3" fill="#FFFFFF" opacity="0.8" />

        {/* Typo BD "FR" */}
        <text
          x="38"
          y="39"
          fill="#FFFFFF"
          fontFamily="'Fredoka', 'Montserrat', 'Inter', system-ui, sans-serif"
          fontSize="14"
          fontWeight="900"
          letterSpacing="0.8px"
          textAnchor="middle"
          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.25)' }}
        >
          FR
        </text>
      </g>

      {/* --- ÉTINCELLE BD DE CONVERSATION / TANDEM --- */}
      <g id="sparkle-bd" transform="translate(48, 29)">
        <path
          d="M 0 -6 Q 0.5 -1 5 0 Q 0.5 1 0 6 Q -0.5 1 -5 0 Q -0.5 -1 0 -6 Z"
          fill="#FBBF24"
          stroke="#111827"
          strokeWidth="1.2"
        />
        <circle cx="0" cy="0" r="1.4" fill="#FFFFFF" />
      </g>

      {/* --- BULLE 2 : NORSK (ROUGE NORVÉGIEN BD) --- */}
      <g id="bulle-no">
        {/* Corps bulle rouge (au premier plan, dialogue croisé) */}
        <path
          d="M 51 37 C 41 37 35 43 35 54 C 35 63 41 69 51 69 L 66 69 L 81 83 L 73 69 L 77 69 C 87 69 93 63 93 54 C 93 43 87 37 77 37 Z"
          fill="#D92838"
          stroke="#111827"
          strokeWidth="3.2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Dégradé doux / lueur interne BD */}
        <path
          d="M 51 39 C 43 39 37.5 44 37.5 54 C 37.5 56 38 58 39 60 C 42 46 54 40 75 40 C 76 39.3 71 39 51 39 Z"
          fill="#EF4444"
          opacity="0.55"
        />

        {/* Reflet blanc courbé BD */}
        <path
          d="M 42 45 C 45 40.5 52 39 62 39"
          stroke="#FFFFFF"
          strokeWidth="2.8"
          strokeLinecap="round"
          opacity="0.8"
        />

        {/* Petit point de brillance BD */}
        <circle cx="40" cy="49" r="1.3" fill="#FFFFFF" opacity="0.8" />

        {/* Typo BD "NO" */}
        <text
          x="65"
          y="58"
          fill="#FFFFFF"
          fontFamily="'Fredoka', 'Montserrat', 'Inter', system-ui, sans-serif"
          fontSize="14"
          fontWeight="900"
          letterSpacing="0.8px"
          textAnchor="middle"
          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.25)' }}
        >
          NO
        </text>
      </g>

      {/* Petits traits d'action / vibration BD discrets */}
      <g stroke="#111827" strokeWidth="1.5" strokeLinecap="round" opacity="0.6">
        <line x1="8" y1="21" x2="6" y2="18" />
        <line x1="88" y1="74" x2="92" y2="76" />
      </g>
    </svg>
  );

  if (variant === 'badge') {
    return (
      <div
        className={`relative inline-flex items-center justify-center rounded-xl bg-gradient-to-b from-[#FAF8F5] to-[#F1ECE1] p-1 border border-[#E0D9CB] shadow-xs group-hover:scale-105 group-hover:border-[#2E4A3D]/40 transition-transform ${className}`}
      >
        {icon}
      </div>
    );
  }

  return icon;
};
