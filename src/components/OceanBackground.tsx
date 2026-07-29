export function OceanBackground() {
  return (
    <div className="ocean-bg" aria-hidden="true">
      <Ship className="ship" />
      <Ship className="ship s2" />
      <Ship className="ship s3" />
    </div>
  );
}

function Ship({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 240 90"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* hull */}
      <path
        d="M10 60 L230 60 L210 82 L30 82 Z"
        fill="oklch(0.22 0.04 235)"
        stroke="oklch(0.35 0.06 210)"
        strokeWidth="1.5"
      />
      {/* deck */}
      <rect x="40" y="46" width="160" height="14" fill="oklch(0.28 0.05 220)" />
      {/* containers */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <rect
          key={i}
          x={45 + i * 19}
          y={30}
          width={16}
          height={16}
          fill={
            ["oklch(0.58 0.18 25)", "oklch(0.68 0.15 155)", "oklch(0.72 0.15 200)", "oklch(0.78 0.16 75)"][i % 4]
          }
          opacity="0.85"
        />
      ))}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <rect
          key={`t${i}`}
          x={45 + i * 19}
          y={14}
          width={16}
          height={16}
          fill={
            ["oklch(0.72 0.15 200)", "oklch(0.58 0.18 25)", "oklch(0.78 0.16 75)", "oklch(0.68 0.15 155)"][i % 4]
          }
          opacity="0.85"
        />
      ))}
      {/* bridge */}
      <rect x="200" y="20" width="22" height="30" fill="oklch(0.30 0.05 220)" />
      <rect x="204" y="26" width="14" height="4" fill="oklch(0.85 0.05 210)" opacity="0.7" />
      {/* mast */}
      <line x1="211" y1="20" x2="211" y2="5" stroke="oklch(0.4 0.03 230)" strokeWidth="1.5" />
    </svg>
  );
}
