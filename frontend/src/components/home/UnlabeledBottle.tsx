import React from 'react';

export type UnlabeledBottleOilType = 'peanut' | 'sesame' | 'coconut' | 'sachi';

interface UnlabeledBottleProps {
  type?: UnlabeledBottleOilType;
  className?: string;
  style?: React.CSSProperties;
  ariaLabel?: string;
  idPrefix?: string;
}

export function UnlabeledBottle({
  type = 'peanut',
  className = 'unlabeled-bottle-svg',
  style,
  ariaLabel = 'Chai dầu thủy tinh không nhãn HM NATURALS',
  idPrefix,
}: UnlabeledBottleProps) {
  const isPeanut = type === 'peanut';
  const isSesame = type === 'sesame';
  const isCoconut = type === 'coconut';

  const reactId = React.useId().replace(/:/g, '_');
  const p = idPrefix ? `${idPrefix}_` : `ub_${reactId}_`;
  const oilGradId = `${p}oilGrad_${type}`;
  const woodCapGradId = `${p}woodCapGrad`;
  const glassWallGradId = `${p}glassWallGrad`;
  const bottleShadowId = `${p}bottleShadow`;

  const oilSurfaceColor = isPeanut
    ? '#FFE899'
    : isSesame
    ? '#FCD34D'
    : isCoconut
    ? '#FEF9C3'
    : '#FEF08A';

  return (
    <svg
      className={className}
      style={style}
      viewBox="0 0 380 480"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={ariaLabel}
    >
      <defs>
        <linearGradient id={oilGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          {isPeanut ? (
            <>
              <stop offset="0%" stopColor="#FFDD80" stopOpacity="0.95" />
              <stop offset="35%" stopColor="#F59E0B" stopOpacity="0.92" />
              <stop offset="75%" stopColor="#D97706" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#B45309" stopOpacity="0.98" />
            </>
          ) : isSesame ? (
            <>
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.95" />
              <stop offset="40%" stopColor="#B45309" stopOpacity="0.95" />
              <stop offset="80%" stopColor="#78350F" stopOpacity="0.98" />
              <stop offset="100%" stopColor="#451A03" stopOpacity="0.98" />
            </>
          ) : isCoconut ? (
            <>
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.98" />
              <stop offset="30%" stopColor="#FEF9C3" stopOpacity="0.92" />
              <stop offset="70%" stopColor="#FDE68A" stopOpacity="0.90" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.85" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#FDE047" stopOpacity="0.95" />
              <stop offset="40%" stopColor="#EAB308" stopOpacity="0.92" />
              <stop offset="80%" stopColor="#CA8A04" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#854D0E" stopOpacity="0.98" />
            </>
          )}
        </linearGradient>

        <linearGradient id={woodCapGradId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#4A2810" />
          <stop offset="25%" stopColor="#78441B" />
          <stop offset="60%" stopColor="#8F5324" />
          <stop offset="85%" stopColor="#6E3B15" />
          <stop offset="100%" stopColor="#3D1E08" />
        </linearGradient>

        <linearGradient id={glassWallGradId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.5" />
          <stop offset="8%" stopColor="#FFFFFF" stopOpacity="0.15" />
          <stop offset="90%" stopColor="#FFFFFF" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.4" />
        </linearGradient>

        <filter id={bottleShadowId} x="-30%" y="-20%" width="160%" height="160%">
          <feDropShadow dx="-10" dy="24" stdDeviation="18" floodColor="#362212" floodOpacity="0.18" />
          <feDropShadow dx="-4" dy="8" stdDeviation="8" floodColor="#362212" floodOpacity="0.12" />
        </filter>
      </defs>

      <g transform="translate(190, 240) rotate(-24) translate(-90, -185)" filter={`url(#${bottleShadowId})`}>
        {/* Outer Glass Body (Rounded Rectangular Shape) */}
        <path
          d="M 30 75 C 30 62, 40 52, 54 48 L 74 44 L 74 18 C 74 12, 78 8, 84 8 L 96 8 C 102 8, 106 12, 106 18 L 106 44 L 126 48 C 140 52, 150 62, 150 75 L 150 310 C 150 326, 138 338, 122 338 L 58 338 C 42 338, 30 326, 30 310 Z"
          fill={`url(#${glassWallGradId})`}
          stroke="rgba(255,255,255,0.45)"
          strokeWidth="1.5"
        />

        {/* Thick Glass Bottom Base */}
        <path
          d="M 32 305 L 148 305 L 148 312 C 148 324, 136 335, 122 335 L 58 335 C 44 335, 32 324, 32 312 Z"
          fill="rgba(255,248,235,0.22)"
        />
        <path
          d="M 44 326 Q 90 332 136 326"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="2"
          fill="none"
        />

        {/* Translucent Edible Oil Interior (Nearly Full ~90%) */}
        <path
          d="M 36 82 L 144 82 L 144 304 C 144 316, 134 324, 120 324 L 60 324 C 46 324, 36 316, 36 304 Z"
          fill={`url(#${oilGradId})`}
        />

        {/* Exactly One Realistic Oil Surface (Meniscus Curve) */}
        <ellipse cx="90" cy="82" rx="54" ry="8" fill={oilSurfaceColor} opacity="0.85" />
        <ellipse cx="90" cy="82" rx="50" ry="6" fill={`url(#${oilGradId})`} opacity="0.6" />
        <path
          d="M 42 82 Q 90 87 138 82"
          stroke="rgba(255,255,255,0.6)"
          strokeWidth="1.8"
          fill="none"
        />

        {/* Primary Specular Light Reflection */}
        <path
          d="M 42 90 L 42 295"
          stroke="rgba(255,255,255,0.65)"
          strokeWidth="4.5"
          strokeLinecap="round"
          opacity="0.85"
        />
        <path
          d="M 48 98 L 48 285"
          stroke="rgba(255,255,255,0.28)"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Secondary Right Wall Specular */}
        <path
          d="M 138 95 L 138 290"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Shoulder Light Refraction Curve */}
        <path
          d="M 46 56 Q 58 50 74 47"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Neck Specular */}
        <line
          x1="78"
          y1="16"
          x2="78"
          y2="40"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="2"
        />

        {/* Wooden Cap with Chamfered Edges and Wood Grain Tone */}
        <rect
          x="70"
          y="0"
          width="40"
          height="28"
          rx="4"
          fill={`url(#${woodCapGradId})`}
          stroke="#2D1505"
          strokeWidth="1"
        />
        <line
          x1="72"
          y1="8"
          x2="108"
          y2="8"
          stroke="#9A5C2A"
          strokeWidth="1.2"
          opacity="0.8"
        />
        <line
          x1="72"
          y1="16"
          x2="108"
          y2="16"
          stroke="#3D1E08"
          strokeWidth="1"
          opacity="0.6"
        />
        <line
          x1="72"
          y1="22"
          x2="108"
          y2="22"
          stroke="#3D1E08"
          strokeWidth="1"
          opacity="0.6"
        />
        <path
          d="M 72 3 Q 90 5 108 3"
          stroke="rgba(255,255,255,0.4)"
          strokeWidth="1.2"
          fill="none"
        />
      </g>
    </svg>
  );
}

export function MiniBottleThumb({
  type,
  className,
}: {
  type: UnlabeledBottleOilType;
  className?: string;
}) {
  const isPeanut = type === 'peanut';
  const isSesame = type === 'sesame';
  const isCoconut = type === 'coconut';
  const oilColor = isPeanut
    ? '#F59E0B'
    : isSesame
    ? '#B45309'
    : isCoconut
    ? '#FDE047'
    : '#EAB308';

  return (
    <svg
      width="24"
      height="42"
      viewBox="0 0 28 48"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect x="9" y="1" width="10" height="8" rx="2" fill="#5C3818" />
      <rect
        x="4"
        y="9"
        width="20"
        height="36"
        rx="4"
        fill="rgba(255,255,255,0.4)"
        stroke="rgba(217,205,191,0.6)"
        strokeWidth="1"
      />
      <rect x="6" y="14" width="16" height="29" rx="3" fill={oilColor} />
      <ellipse cx="14" cy="14" rx="8" ry="2" fill="#FFE899" opacity="0.8" />
      <line
        x1="8"
        y1="16"
        x2="8"
        y2="40"
        stroke="rgba(255,255,255,0.6)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
