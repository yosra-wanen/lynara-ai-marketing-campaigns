'use client';

import { useMemo } from 'react';
import {
  LogoEmail,
  LogoWhatsApp,
  LogoInstagram,
  LogoFacebook,
  IconAgentIA,
} from './PlatformLogos';

/* Floating cards with platform logos + AI agent, connecting lines, purple nodes. Sans images de profil. */
const CARD_SIZE_PCT = 18;
const NODE_R = 2.5;

type CardSlot = {
  id: string;
  label: string;
  bg: string;
  logo: 'email' | 'whatsapp' | 'instagram' | 'facebook' | 'ai';
  leftPct: number;
  topPct: number;
  delay: string;
};

const cards: CardSlot[] = [
  { id: '1', label: 'Email', bg: 'bg-[#EA4335]', logo: 'email', leftPct: 12.5, topPct: 10, delay: '0s' },
  { id: '2', label: 'WhatsApp', bg: 'bg-[#25D366]', logo: 'whatsapp', leftPct: 6, topPct: 60, delay: '0.3s' },
  { id: '3', label: 'IA', bg: 'bg-[#A079FF]', logo: 'ai', leftPct: 34, topPct: 35, delay: '0.15s' },
  { id: '4', label: 'Instagram', bg: 'bg-gradient-to-br from-[#FED576] via-[#F47133] to-[#BC3081]', logo: 'instagram', leftPct: 62.5, topPct: 12.5, delay: '0.45s' },
  { id: '5', label: 'Facebook', bg: 'bg-[#1877F2]', logo: 'facebook', leftPct: 68.75, topPct: 57.5, delay: '0.6s' },
];

/* Lines in viewBox 0 0 320 200 - coordinates in pixels */
function linePx(x1: number, y1: number, x2: number, y2: number) {
  return `M ${x1} ${y1} L ${x2} ${y2}`;
}

const nodePositionsPct: [number, number][] = [
  [26, 27], [22, 48], [43, 42], [55, 27], [55, 48],
];

function LogoContent({ logo }: { logo: CardSlot['logo'] }) {
  const size = 32;
  const white = 'text-white';
  switch (logo) {
    case 'email':
      return <LogoEmail size={size} className={white} />;
    case 'whatsapp':
      return <LogoWhatsApp size={size} className="[&_path]:!fill-white" />;
    case 'instagram':
      return <LogoInstagram size={size} className={white} />;
    case 'facebook':
      return <LogoFacebook size={size} className="[&_path]:!fill-white" />;
    case 'ai':
      return <IconAgentIA size={size} white className={white} />;
    default:
      return null;
  }
}

export function HeroFloatingCards() {
  const paths = useMemo(() => {
    const w = 320;
    const h = 200;
    const c = CARD_SIZE_PCT / 100;
    const cx = (leftPct: number, topPct: number) => ({
      x: (leftPct / 100) * w + (c * w) / 2,
      y: (topPct / 100) * h + (c * h) / 2,
    });
    const card = (leftPct: number, topPct: number) => cx(leftPct, topPct);
    return [
      linePx(card(12.5, 10).x, card(12.5, 10).y, card(34, 35).x, card(34, 35).y),
      linePx(card(6, 60).x, card(6, 60).y, card(34, 35).x, card(34, 35).y),
      linePx(card(34, 35).x, card(34, 35).y, card(62.5, 12.5).x, card(62.5, 12.5).y),
      linePx(card(34, 35).x, card(34, 35).y, card(68.75, 57.5).x, card(68.75, 57.5).y),
    ];
  }, []);

  return (
    <div className="relative w-full max-w-[420px] md:max-w-[520px] mx-auto" style={{ aspectRatio: '320/200' }}>
      <div className="absolute inset-0">
        <svg
          className="absolute inset-0 h-full w-full overflow-visible"
          viewBox="0 0 320 200"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden
        >
          {paths.map((d, i) => (
            <path
              key={i}
              d={d}
              fill="none"
              stroke="rgb(203 213 225)"
              strokeWidth="1.5"
              className="dark:stroke-gray-500"
            />
          ))}
          {nodePositionsPct.map(([px, py], i) => (
            <circle
              key={i}
              r={NODE_R}
              cx={(px / 100) * 320}
              cy={(py / 100) * 200}
              fill="#A079FF"
              className="dark:fill-[#B394FF]"
            />
          ))}
        </svg>

        {cards.map(({ id, label, bg, logo, leftPct, topPct, delay }) => (
          <div
            key={id}
            className="absolute flex h-[18%] w-[18%] max-h-20 max-w-20 min-h-[52px] min-w-[52px] items-center justify-center rounded-2xl shadow-lg transition-shadow hover:shadow-xl dark:shadow-gray-900/30"
            style={{
              left: `${leftPct}%`,
              top: `${topPct}%`,
              animation: 'float 3s ease-in-out infinite',
              animationDelay: delay,
            }}
          >
            <div className={`flex items-center justify-center rounded-2xl h-full w-full text-white ${bg}`}>
              <LogoContent logo={logo} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
