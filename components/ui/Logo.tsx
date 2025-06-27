import * as React from "react";

export function Logo({ className }: { className?: string }) {
  return (
    <svg
      width="120"
      height="40"
      viewBox="0 0 120 40"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#8b5cf6', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@600&display=swap');
        `}
      </style>
      <text
        x="0"
        y="28"
        fontFamily="Poppins, sans-serif"
        fontSize="24"
        fontWeight="600"
        fill="url(#logoGradient)"
      >
        S
        <tspan dy="-2">
          i
          <tspan>
            g
            <tspan>
              n
              <tspan>
                a
                <tspan>l</tspan>
              </tspan>
            </tspan>
          </tspan>
        </tspan>
        s
      </text>
      {/* Signal wave animation */}
      <path
        d="M 68 20 Q 73 10, 78 20 T 88 20"
        stroke="url(#logoGradient)"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      >
        <animate
          attributeName="d"
          values="M 68 20 Q 73 10, 78 20 T 88 20; M 68 20 Q 73 30, 78 20 T 88 20; M 68 20 Q 73 10, 78 20 T 88 20"
          dur="2s"
          repeatCount="indefinite"
        />
      </path>
    </svg>
  );
}
