import React from 'react';

export type ProductVisualType = 'peanut' | 'sesame' | 'sachi' | 'byproduct' | 'gac' | 'coconut' | 'seeds';

interface ProductBottleImageProps {
  type: ProductVisualType;
  className?: string;
  alt?: string;
}

export function ProductBottleImage({ type, className = 'w-full h-full object-contain', alt = 'Sản phẩm HM Naturals' }: ProductBottleImageProps) {
  switch (type) {
    case 'peanut':
      return (
        <svg
          viewBox="0 0 600 450"
          className={className}
          role="img"
          aria-label={alt}
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="600" height="450" fill="#F4EDE3" />
          <radialGradient id="bgPeanut" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFF" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#EAE0D2" stopOpacity="0.3" />
          </radialGradient>
          <rect width="600" height="450" fill="url(#bgPeanut)" />
          {/* Shadow */}
          <ellipse cx="300" cy="390" rx="95" ry="14" fill="#3D3024" opacity="0.18" />
          {/* Glass Bottle Body */}
          <path
            d="M255 120 h90 v30 l25 45 v170 c0 14 -10 24 -24 24 h-92 c-14 0 -24 -10 -24 -24 v-170 l25 -45 z"
            fill="#B87326"
          />
          {/* Inner Golden Oil Core */}
          <path
            d="M260 195 h80 v165 c0 10 -8 18 -18 18 h-44 c-10 0 -18 -8 -18 -18 z"
            fill="#D98A2B"
          />
          {/* Glass Reflection Highlight */}
          <path d="M264 200 v160" stroke="#FFF" strokeWidth="4" opacity="0.4" strokeLinecap="round" />
          {/* Dark Wooden Cork / Screw Cap */}
          <rect x="272" y="86" width="56" height="34" rx="4" fill="#54361C" />
          {/* Artisanal Paper Label */}
          <rect x="264" y="225" width="72" height="105" rx="3" fill="#FAF6EE" stroke="#DCCFBC" />
          <text x="300" y="246" fontFamily="serif" fontSize="8" fontWeight="bold" fill="#26402F" textAnchor="middle">
            HM NATURALS
          </text>
          <line x1="274" y1="252" x2="326" y2="252" stroke="#C88B3A" strokeWidth="1" />
          <circle cx="300" cy="273" r="12" fill="#F0E5D4" stroke="#7A4B13" strokeWidth="0.8" />
          <text x="300" y="278" fontSize="11" textAnchor="middle">🥜</text>
          <text x="300" y="302" fontFamily="serif" fontSize="8" fontWeight="bold" fill="#221A14" textAnchor="middle">
            ĐẬU PHỘNG
          </text>
          <text x="300" y="316" fontFamily="sans-serif" fontSize="7" fill="#6E7448" textAnchor="middle">
            ÉP LẠNH THÔ
          </text>
        </svg>
      );

    case 'sesame':
      return (
        <svg
          viewBox="0 0 600 450"
          className={className}
          role="img"
          aria-label={alt}
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="600" height="450" fill="#F4EDE3" />
          <radialGradient id="bgSesame" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFF" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#EAE0D2" stopOpacity="0.3" />
          </radialGradient>
          <rect width="600" height="450" fill="url(#bgSesame)" />
          {/* Shadow */}
          <ellipse cx="300" cy="390" rx="85" ry="13" fill="#3D3024" opacity="0.18" />
          {/* Dark Amber Glass Bottle */}
          <path
            d="M265 130 h70 v30 l20 40 v165 c0 12 -8 20 -20 20 h-70 c-12 0 -20 -8 -20 -20 v-165 l20 -40 z"
            fill="#613914"
          />
          {/* Deep Toasted Sesame Oil Core */}
          <path
            d="M270 200 h60 v155 c0 8 -6 14 -14 14 h-32 c-8 0 -14 -6 -14 -14 z"
            fill="#804B1B"
          />
          {/* Reflection */}
          <path d="M274 205 v145" stroke="#FFF" strokeWidth="3.5" opacity="0.35" strokeLinecap="round" />
          {/* Cork */}
          <rect x="278" y="98" width="44" height="32" rx="4" fill="#3B220C" />
          {/* Label */}
          <rect x="272" y="228" width="56" height="100" rx="3" fill="#FBF7F0" stroke="#DCCFBC" />
          <text x="300" y="246" fontFamily="serif" fontSize="7.5" fontWeight="bold" fill="#26402F" textAnchor="middle">
            HM NATURALS
          </text>
          <line x1="278" y1="252" x2="322" y2="252" stroke="#7A4B13" strokeWidth="0.8" />
          <circle cx="300" cy="272" r="10" fill="#E8DEC8" stroke="#3B220C" />
          <text x="300" y="277" fontSize="10" textAnchor="middle">🌾</text>
          <text x="300" y="300" fontFamily="serif" fontSize="7.5" fontWeight="bold" fill="#221A14" textAnchor="middle">
            MÈ ĐEN RANG
          </text>
          <text x="300" y="314" fontFamily="sans-serif" fontSize="6.5" fill="#474E2B" textAnchor="middle">
            THỦ CÔNG
          </text>
        </svg>
      );

    case 'sachi':
      return (
        <svg
          viewBox="0 0 600 450"
          className={className}
          role="img"
          aria-label={alt}
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="600" height="450" fill="#F4EDE3" />
          <radialGradient id="bgSachi" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFF" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#EAE0D2" stopOpacity="0.3" />
          </radialGradient>
          <rect width="600" height="450" fill="url(#bgSachi)" />
          <ellipse cx="300" cy="390" rx="85" ry="13" fill="#3D3024" opacity="0.18" />
          <path
            d="M260 150 h80 v30 l20 35 v145 c0 12 -8 20 -20 20 h-80 c-12 0 -20 -8 -20 -20 v-145 l20 -35 z"
            fill="#3D5943"
          />
          <path
            d="M266 215 h68 v135 c0 8 -6 14 -14 14 h-40 c-8 0 -14 -6 -14 -14 z"
            fill="#54785C"
          />
          <path d="M270 220 v125" stroke="#FFF" strokeWidth="3" opacity="0.4" strokeLinecap="round" />
          <rect x="282" y="95" width="36" height="35" rx="3" fill="#221A14" />
          <rect x="268" y="235" width="64" height="96" rx="3" fill="#FDFBF7" stroke="#DCCFBC" />
          <text x="300" y="253" fontFamily="serif" fontSize="7.5" fontWeight="bold" fill="#26402F" textAnchor="middle">
            HM NATURALS
          </text>
          <polygon
            points="300,266 303,273 311,274 305,279 307,287 300,283 293,287 295,279 289,274 297,273"
            fill="#C88B3A"
          />
          <text x="300" y="304" fontFamily="serif" fontSize="7.5" fontWeight="bold" fill="#221A14" textAnchor="middle">
            HẠT SACHI
          </text>
          <text x="300" y="316" fontFamily="sans-serif" fontSize="6.5" fill="#7A4B13" textAnchor="middle">
            OMEGA 3-6-9
          </text>
        </svg>
      );

    case 'gac':
      return (
        <svg
          viewBox="0 0 600 450"
          className={className}
          role="img"
          aria-label={alt}
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="600" height="450" fill="#F4EDE3" />
          <radialGradient id="bgGac" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFF" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#F8E5D5" stopOpacity="0.3" />
          </radialGradient>
          <rect width="600" height="450" fill="url(#bgGac)" />
          <ellipse cx="300" cy="390" rx="85" ry="13" fill="#3D3024" opacity="0.18" />
          <path
            d="M260 140 h80 v30 l20 35 v155 c0 12 -8 20 -20 20 h-80 c-12 0 -20 -8 -20 -20 v-155 l20 -35 z"
            fill="#8C2418"
          />
          <path
            d="M266 205 h68 v145 c0 8 -6 14 -14 14 h-40 c-8 0 -14 -6 -14 -14 z"
            fill="#C33A26"
          />
          <path d="M270 210 v135" stroke="#FFF" strokeWidth="3" opacity="0.4" strokeLinecap="round" />
          <rect x="278" y="98" width="44" height="32" rx="4" fill="#541B14" />
          <rect x="268" y="235" width="64" height="96" rx="3" fill="#FAF6EE" stroke="#DCCFBC" />
          <text x="300" y="253" fontFamily="serif" fontSize="7.5" fontWeight="bold" fill="#26402F" textAnchor="middle">
            HM NATURALS
          </text>
          <circle cx="300" cy="273" r="11" fill="#E65100" />
          <circle cx="300" cy="273" r="8" fill="#F57C00" />
          <text x="300" y="304" fontFamily="serif" fontSize="7.5" fontWeight="bold" fill="#221A14" textAnchor="middle">
            DẦU GẤC NẾP
          </text>
          <text x="300" y="316" fontFamily="sans-serif" fontSize="6.5" fill="#8C2418" textAnchor="middle">
            BETA-CAROTENE
          </text>
        </svg>
      );

    case 'coconut':
      return (
        <svg
          viewBox="0 0 600 450"
          className={className}
          role="img"
          aria-label={alt}
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="600" height="450" fill="#F4EDE3" />
          <radialGradient id="bgCoconut" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFF" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#EAE0D2" stopOpacity="0.3" />
          </radialGradient>
          <rect width="600" height="450" fill="url(#bgCoconut)" />
          <ellipse cx="300" cy="390" rx="85" ry="13" fill="#3D3024" opacity="0.18" />
          <path
            d="M260 140 h80 v30 l20 35 v155 c0 12 -8 20 -20 20 h-80 c-12 0 -20 -8 -20 -20 v-155 l20 -35 z"
            fill="#4E594D"
          />
          <path
            d="M266 205 h68 v145 c0 8 -6 14 -14 14 h-40 c-8 0 -14 -6 -14 -14 z"
            fill="#F7F6F2"
            opacity="0.9"
          />
          <path d="M270 210 v135" stroke="#FFF" strokeWidth="3" opacity="0.6" strokeLinecap="round" />
          <rect x="278" y="98" width="44" height="32" rx="4" fill="#3B2E24" />
          <rect x="268" y="235" width="64" height="96" rx="3" fill="#FAF6EE" stroke="#DCCFBC" />
          <text x="300" y="253" fontFamily="serif" fontSize="7.5" fontWeight="bold" fill="#26402F" textAnchor="middle">
            HM NATURALS
          </text>
          <circle cx="300" cy="273" r="11" fill="#EAE5DC" stroke="#8D7B68" strokeWidth="0.8" />
          <text x="300" y="278" fontSize="10" textAnchor="middle">🥥</text>
          <text x="300" y="304" fontFamily="serif" fontSize="7.5" fontWeight="bold" fill="#221A14" textAnchor="middle">
            DẦU DỪA
          </text>
          <text x="300" y="316" fontFamily="sans-serif" fontSize="6.5" fill="#474E2B" textAnchor="middle">
            ÉP LẠNH NGUYÊN CHẤT
          </text>
        </svg>
      );

    case 'byproduct':
      return (
        <svg
          viewBox="0 0 600 450"
          className={className}
          role="img"
          aria-label={alt}
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="600" height="450" fill="#F4EDE3" />
          <radialGradient id="bgByproduct" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFF" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#EAE0D2" stopOpacity="0.3" />
          </radialGradient>
          <rect width="600" height="450" fill="url(#bgByproduct)" />
          <ellipse cx="300" cy="390" rx="95" ry="14" fill="#3D3024" opacity="0.18" />
          <path
            d="M230 200 C220 300 230 380 250 385 H350 C370 380 380 300 370 200 Q300 215 230 200 z"
            fill="#C9B293"
          />
          <path
            d="M225 195 Q300 210 375 195 Q365 170 340 180 Q300 170 260 180 Q235 170 225 195 z"
            fill="#B59C78"
          />
          <ellipse cx="300" cy="192" rx="40" ry="7" fill="#6B5339" />
          <rect
            x="255"
            y="240"
            width="90"
            height="90"
            rx="4"
            fill="#FAF6EE"
            stroke="#A88B67"
            strokeDasharray="4 2"
          />
          <text x="300" y="264" fontFamily="serif" fontSize="8.5" fontWeight="bold" fill="#26402F" textAnchor="middle">
            HM NATURALS
          </text>
          <text x="300" y="284" fontFamily="sans-serif" fontSize="8" fill="#7A4B13" textAnchor="middle">
            BÃ NÔNG SẢN
          </text>
          <text x="300" y="306" fontFamily="sans-serif" fontSize="7.5" fill="#474E2B" textAnchor="middle">
            Bao 25kg / 50kg
          </text>
        </svg>
      );

    case 'seeds':
    default:
      return (
        <svg
          viewBox="0 0 600 450"
          className={className}
          role="img"
          aria-label={alt}
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="600" height="450" fill="#F4EDE3" />
          <radialGradient id="bgSeeds" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFF" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#EAE0D2" stopOpacity="0.3" />
          </radialGradient>
          <rect width="600" height="450" fill="url(#bgSeeds)" />
          <ellipse cx="300" cy="385" rx="100" ry="15" fill="#3D3024" opacity="0.18" />
          {/* Burlap Sack Body */}
          <path
            d="M220 220 C210 310 225 380 250 380 H350 C375 380 390 310 380 220 Q300 230 220 220 z"
            fill="#D5C2A5"
          />
          {/* Sack Tie */}
          <rect x="270" y="200" width="60" height="15" rx="5" fill="#8C7355" />
          <text x="300" y="300" fontFamily="serif" fontSize="10" fontWeight="bold" fill="#26402F" textAnchor="middle">
            HẠT NÔNG SẢN
          </text>
          <text x="300" y="320" fontFamily="sans-serif" fontSize="8" fill="#7A4B13" textAnchor="middle">
            CHỌN LỌC VỤ MỚI
          </text>
        </svg>
      );
  }
}

export function getProductVisualType(slug: string): ProductVisualType {
  if (slug.includes('lac') || slug.includes('phong') || slug.includes('peanut')) return 'peanut';
  if (slug.includes('vung') || slug.includes('me') || slug.includes('sesame')) return 'sesame';
  if (slug.includes('sachi')) return 'sachi';
  if (slug.includes('gac')) return 'gac';
  if (slug.includes('dua') || slug.includes('coconut')) return 'coconut';
  if (slug.includes('ba-') || slug.includes('byproduct')) return 'byproduct';
  return 'seeds';
}
