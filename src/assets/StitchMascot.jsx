import React from 'react';

export default function StitchMascot({ size = 120, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`stitch-mascot-svg ${className}`}
      style={{
        filter: 'drop-shadow(0 0 10px rgba(0, 229, 255, 0.35))',
        animation: 'stitchFloat 4s ease-in-out infinite'
      }}
    >
      <style>
        {`
          @keyframes stitchFloat {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-6px); }
          }
          .stitch-head { fill: #1e6091; transition: fill 0.3s; }
          .stitch-nose { fill: #0d2b45; }
          .stitch-eye { fill: #030712; }
          .stitch-highlight { fill: #ffffff; }
          .stitch-ear-inner { fill: #ff9ebb; }
          .stitch-glow { stroke: #00e5ff; stroke-width: 3; filter: drop-shadow(0 0 4px #00e5ff); }
        `}
      </style>
      
      {/* Background soft glow circle */}
      <circle cx="100" cy="100" r="85" fill="rgba(0, 229, 255, 0.05)" />

      {/* LEFT EAR */}
      <path
        d="M60 90C40 70 10 75 15 95C20 115 50 115 65 105C65 105 60 90 60 90Z"
        fill="#1a535c"
      />
      <path
        d="M55 92C38 78 15 82 18 96C22 110 48 110 60 102"
        fill="#ff9ebb"
      />

      {/* RIGHT EAR */}
      <path
        d="M140 90C160 70 190 75 185 95C180 115 150 115 135 105C135 105 140 90 140 90Z"
        fill="#1a535c"
      />
      <path
        d="M145 92C162 78 185 82 182 96C178 110 152 110 140 102"
        fill="#ff9ebb"
      />

      {/* HEAD */}
      <ellipse cx="100" cy="105" rx="48" ry="40" fill="#206a8f" />
      <path
        d="M52 105C52 130 73 145 100 145C127 145 148 130 148 105C148 90 127 80 100 80C73 80 52 90 52 105Z"
        fill="#267fa3"
      />

      {/* NOSE */}
      <path
        d="M92 112C92 107 108 107 108 112C108 118 92 118 92 112Z"
        fill="#122a3d"
      />

      {/* LEFT EYE */}
      <ellipse cx="76" cy="104" rx="11" ry="14" fill="#ffffff" />
      <ellipse cx="77" cy="104" rx="8" ry="11" fill="#121824" />
      <circle cx="75" cy="100" r="3.5" fill="#ffffff" />
      <circle cx="80" cy="106" r="1.5" fill="#ffffff" />

      {/* RIGHT EYE */}
      <ellipse cx="124" cy="104" rx="11" ry="14" fill="#ffffff" />
      <ellipse cx="123" cy="104" rx="8" ry="11" fill="#121824" />
      <circle cx="121" cy="100" r="3.5" fill="#ffffff" />
      <circle cx="126" cy="106" r="1.5" fill="#ffffff" />

      {/* CHEEKS */}
      <circle cx="63" cy="115" r="4" fill="#ff7096" opacity="0.4" />
      <circle cx="137" cy="115" r="4" fill="#ff7096" opacity="0.4" />

      {/* MOUTH (Happy smile) */}
      <path
        d="M88 123C93 128 107 128 112 123"
        stroke="#122a3d"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* GLOWING CODER HEADSET */}
      <path
        d="M50 105C50 72 65 58 100 58C135 58 150 72 150 105"
        stroke="#00e5ff"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
        style={{ filter: 'drop-shadow(0 0 4px #00e5ff)' }}
      />
      {/* Left ear pad */}
      <rect
        x="43"
        y="96"
        width="10"
        height="18"
        rx="4"
        fill="#00e5ff"
        style={{ filter: 'drop-shadow(0 0 5px rgba(0, 229, 255, 0.8))' }}
      />
      {/* Right ear pad */}
      <rect
        x="147"
        y="96"
        width="10"
        height="18"
        rx="4"
        fill="#00e5ff"
        style={{ filter: 'drop-shadow(0 0 5px rgba(0, 229, 255, 0.8))' }}
      />
      {/* Headset Mic */}
      <path
        d="M50 112C50 125 70 133 72 130"
        stroke="#00e5ff"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="72" cy="130" r="2.5" fill="#00e5ff" />
    </svg>
  );
}
