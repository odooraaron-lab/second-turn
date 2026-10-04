// A game box lid in the shop's colours, on the login page. The die tumbles in once on load.
export function GameBoxArt({ name }: { name: string }) {
  return (
    <svg className="box-art" viewBox="0 0 400 300" role="img" aria-label={`${name} game box lid with a die`}>
      <rect x="6" y="10" width="388" height="280" rx="14" className="box-side" />
      <rect x="0" y="0" width="388" height="280" rx="14" className="box-lid" />
      <rect x="18" y="18" width="352" height="244" rx="8" className="box-panel" />
      {/* track squares around the panel edge */}
      <g className="box-track">
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={`t${i}`} x={30 + i * 42} y="30" width="36" height="36" rx="5" />
        ))}
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={`b${i}`} x={30 + i * 42} y="214" width="36" height="36" rx="5" />
        ))}
      </g>
      <text x="194" y="152" textAnchor="middle" className="box-title">
        {name}
      </text>
      <text x="194" y="182" textAnchor="middle" className="box-sub">
        Back office, 2 to 6 players
      </text>
      <g className="box-die">
        <rect x="-26" y="-26" width="52" height="52" rx="10" />
        <circle cx="-12" cy="-12" r="5" />
        <circle cx="12" cy="12" r="5" />
      </g>
    </svg>
  );
}
