'use client';

import {
  LogoEmail,
  LogoWhatsApp,
  LogoInstagram,
  LogoFacebook,
  LogoTikTok,
  IconAgentIA,
} from './PlatformLogos';

/** Diagramme d'intégration : centre IA (gradient) + 5 plateformes (logos exacts), lignes en pointillés grises, une ligne violette pleine + point animé. Responsive et animé. */
const RADIUS = 76;
const CENTER = 100;
const PLATFORMS: Array<{ logo: 'email' | 'whatsapp' | 'instagram' | 'facebook' | 'tiktok'; angle: number }> = [
  { logo: 'email', angle: -90 },
  { logo: 'whatsapp', angle: 0 },
  { logo: 'instagram', angle: 90 },
  { logo: 'facebook', angle: 180 },
  { logo: 'tiktok', angle: 270 },
];

const HIGHLIGHTED_LINE_INDEX = 0; // Email = ligne violette pleine + point animé

function polar(angleDeg: number, r: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: CENTER + r * Math.cos(rad), y: CENTER + r * Math.sin(rad) };
}

function LogoIcon({ logo, size = 18 }: { logo: (typeof PLATFORMS)[number]['logo']; size?: number }) {
  switch (logo) {
    case 'email':
      return <LogoEmail size={size} className="text-[#1E293B] dark:text-[#F5F5F5]" />;
    case 'whatsapp':
      return <LogoWhatsApp size={size} className="[&_path]:!fill-[#25D366]" />;
    case 'instagram':
      return <LogoInstagram size={size} className="text-[#E1306C]" />;
    case 'facebook':
      return <LogoFacebook size={size} className="[&_path]:!fill-[#1877F2]" />;
    case 'tiktok':
      return <LogoTikTok size={size} className="text-[#000000] dark:text-[#F5F5F5]" />;
    default:
      return null;
  }
}

export function IntegrationDiagram() {
  const positions = PLATFORMS.map(({ angle }) => polar(angle, RADIUS));
  const toPath = (i: number) => {
    const p = positions[i];
    const dx = CENTER - p.x;
    const dy = CENTER - p.y;
    const qx = CENTER + dx * 0.5 + dy * 0.25;
    const qy = CENTER + dy * 0.5 - dx * 0.25;
    return `M ${p.x} ${p.y} Q ${qx} ${qy} ${CENTER} ${CENTER}`;
  };

  return (
    <div className="relative w-full max-w-[260px] sm:max-w-[300px] mx-auto aspect-square">
      <svg
        className="h-full w-full overflow-visible"
        viewBox="0 0 200 200"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden
      >
        <defs>
          <linearGradient id="flow-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6D3FEB" />
            <stop offset="50%" stopColor="#A079FF" />
            <stop offset="100%" stopColor="#C4A8FF" />
          </linearGradient>
        </defs>

        {/* Lignes en pointillés grises (toutes sauf la ligne mise en avant) - apparition en fondu */}
        {positions.map((_, i) =>
          i === HIGHLIGHTED_LINE_INDEX ? null : (
            <path
              key={`dashed-${i}`}
              d={toPath(i)}
              fill="none"
              stroke="rgb(203 213 225)"
              strokeWidth="1.5"
              strokeDasharray="5 4"
              className="dark:stroke-gray-500"
              style={{
                animation: 'fade-in 0.5s ease-out forwards',
                animationDelay: `${i * 0.08}s`,
                opacity: 0,
              }}
            />
          )
        )}

        {/* Ligne violette pleine (Email) + point animé */}
        <path
          d={toPath(HIGHLIGHTED_LINE_INDEX)}
          fill="none"
          stroke="url(#flow-grad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          style={{
            animation: 'fade-in 0.5s ease-out forwards',
            animationDelay: '0.05s',
            opacity: 0,
          }}
        />
        <circle r="5" fill="#A079FF" className="drop-shadow-sm">
          <animateMotion dur="2.2s" repeatCount="indefinite" path={toPath(HIGHLIGHTED_LINE_INDEX)} />
        </circle>

        {/* Centre : cercle gradient + icône IA avec pulse */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r="30"
          fill="url(#flow-grad)"
          className="drop-shadow-lg"
          style={{ animation: 'diagram-pulse 2.5s ease-in-out infinite' }}
        />
        <g transform={`translate(${CENTER - 14}, ${CENTER - 14})`}>
          <foreignObject width={28} height={28}>
            <div className="flex h-7 w-7 items-center justify-center text-white">
              <IconAgentIA size={18} white className="text-white" />
            </div>
          </foreignObject>
        </g>

        {/* Nœuds plateformes : cercles blancs + logos exacts, apparition décalée */}
        {positions.map((p, i) => (
          <g
            key={i}
            style={{
              animation: 'diagram-node-in 0.5s ease-out forwards',
              animationDelay: `${0.15 + i * 0.1}s`,
              opacity: 0,
            }}
          >
            <circle
              cx={p.x}
              cy={p.y}
              r="20"
              fill="white"
              stroke="rgb(226 232 240)"
              strokeWidth="1.5"
              className="dark:fill-gray-800 dark:stroke-gray-600"
            />
            <g transform={`translate(${p.x - 9}, ${p.y - 9})`}>
              <foreignObject width={18} height={18}>
                <div className="flex h-[18px] w-[18px] items-center justify-center [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0">
                  <LogoIcon logo={PLATFORMS[i].logo} size={16} />
                </div>
              </foreignObject>
            </g>
          </g>
        ))}
      </svg>
    </div>
  );
}
