'use client';

import React, { useId } from 'react';
import { ArtType, ColorDef, ColorKey } from '@/types';
import { PAL } from '@/lib/products';

interface ProductArtProps {
  type: ArtType;
  color?: ColorKey;
  view?: 0 | 1 | 2 | 3 | 'bare';
  className?: string;
  ariaLabel?: string;
}

const GOLD = '#e3b94b';

function lin(id: string, a: string, b: string, h?: boolean) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2={h ? 1 : 0} y2={h ? 0 : 1}>
      <stop offset="0" stopColor={a} />
      <stop offset="1" stopColor={b} />
    </linearGradient>
  );
}

export const ProductArt: React.FC<ProductArtProps> = ({
  type,
  color = 'violet',
  view = 0,
  className = '',
  ariaLabel,
}) => {
  const reactId = useId().replace(/[:]/g, '');
  const c: ColorDef = PAL[color] || PAL.violet;
  const u = `${reactId}_${color}`;

  const renderShape = () => {
    switch (type) {
      case 'dress':
        return (
          <>
            <defs>
              {lin('a' + u, c.light, c.main)}
              {lin('b' + u, c.main, c.dark)}
            </defs>
            <path
              d="M168 88 L184 88 L200 124 L216 88 L232 88 L241 172 Q200 192 159 172 Z"
              fill={`url(#a${u})`}
            />
            <path
              d="M159 172 Q200 192 241 172 L298 334 Q200 358 102 334 Z"
              fill={`url(#b${u})`}
            />
            <path
              d="M157 168 Q200 188 243 168 L242 183 Q200 203 158 183 Z"
              fill={c.deep}
              opacity=".85"
            />
            <g fill={c.light} opacity=".55">
              <circle cx="172" cy="238" r="7" />
              <circle cx="216" cy="228" r="5" />
              <circle cx="246" cy="266" r="8" />
              <circle cx="190" cy="290" r="6" />
              <circle cx="150" cy="304" r="5" />
              <circle cx="238" cy="320" r="6" />
              <circle cx="280" cy="314" r="4" />
              <circle cx="206" cy="326" r="4" />
            </g>
            <path
              d="M200 192 Q188 262 150 338 M200 192 Q214 264 250 340"
              stroke={c.deep}
              strokeOpacity=".25"
              strokeWidth="3"
              fill="none"
            />
          </>
        );

      case 'abaya':
        return (
          <>
            <defs>
              {lin('a' + u, c.main, c.dark)}
              {lin('b' + u, c.light, c.main)}
            </defs>
            <path d="M156 112 L90 262 Q108 284 134 270 L178 150 Z" fill={c.dark} />
            <path d="M244 112 L310 262 Q292 284 266 270 L222 150 Z" fill={c.dark} />
            <path
              d="M164 84 Q200 66 236 84 L246 116 L308 344 Q200 368 92 344 L154 116 Z"
              fill={`url(#a${u})`}
            />
            <path
              d="M176 86 Q200 114 224 86"
              stroke={c.light}
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
            />
            <path d="M200 106 L200 352" stroke={c.deep} strokeOpacity=".4" strokeWidth="3" />
            <path
              d="M97 262 L134 276 M303 262 L266 276"
              stroke={c.light}
              strokeWidth="6"
              strokeLinecap="round"
            />
            <rect x="166" y="196" width="68" height="15" rx="3" fill={c.light} opacity=".9" />
            <circle cx="200" cy="203.5" r="8" fill={GOLD} />
            <path
              d="M106 338 Q200 362 294 338"
              stroke={c.light}
              strokeWidth="3"
              fill="none"
              strokeDasharray="2 8"
              strokeLinecap="round"
            />
          </>
        );

      case 'hoodie':
        return (
          <>
            <defs>
              {lin('a' + u, c.main, c.dark)}
              {lin('b' + u, c.dark, c.deep)}
            </defs>
            <path d="M142 132 L88 272 L128 292 L152 192 Z" fill={c.dark} />
            <path d="M258 132 L312 272 L272 292 L248 192 Z" fill={c.dark} />
            <path
              d="M142 128 Q200 108 258 128 L270 334 Q200 350 130 334 Z"
              fill={`url(#a${u})`}
            />
            <path
              d="M164 126 Q164 66 200 64 Q236 66 236 126 Q200 156 164 126 Z"
              fill={`url(#b${u})`}
            />
            <path d="M178 122 Q200 100 222 122 Q200 140 178 122 Z" fill={c.deep} />
            <path
              d="M190 138 L188 186 M210 138 L212 186"
              stroke={c.light}
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path d="M158 268 L242 268 L252 314 L148 314 Z" fill={c.deep} opacity=".35" />
            <rect x="132" y="322" width="136" height="16" rx="6" fill={c.dark} />
            <path
              d="M92 270 L124 286 M308 270 L276 286"
              stroke={c.dark}
              strokeWidth="12"
              strokeLinecap="round"
            />
          </>
        );

      case 'sneaker':
        return (
          <>
            <defs>{lin('a' + u, c.light, c.main)}</defs>
            <path
              d="M92 262 L92 215 Q92 200 108 198 L150 196 Q170 160 205 165 L225 190 Q270 200 305 235 Q322 250 322 262 Z"
              fill={`url(#a${u})`}
            />
            <path
              d="M268 214 Q310 232 322 262 L260 262 Q262 236 268 214 Z"
              fill={c.dark}
            />
            <path d="M92 215 L116 215 L116 252 L92 252 Z" fill={c.dark} />
            <path
              d="M110 248 Q190 206 262 248"
              stroke={c.deep}
              strokeOpacity=".55"
              strokeWidth="7"
              fill="none"
              strokeLinecap="round"
            />
            <g stroke="#f5f0ff" strokeWidth="5" strokeLinecap="round">
              <path d="M180 182 L204 192" />
              <path d="M192 196 L218 204" />
              <path d="M206 208 L232 214" />
              <path d="M220 220 L246 224" />
            </g>
            <path
              d="M80 262 L328 262 Q334 296 304 300 L106 300 Q80 300 80 262 Z"
              fill="#f5f0ff"
            />
            <path d="M84 280 L326 280" stroke={c.main} strokeWidth="6" />
            <path d="M84 292 Q200 298 322 290" stroke="#cdbfe8" strokeWidth="3" fill="none" />
          </>
        );

      case 'heel':
        return (
          <>
            <defs>{lin('a' + u, c.light, c.main)}</defs>
            <path d="M104 246 L150 258 L142 312 L100 312 Z" fill={c.dark} />
            <path
              d="M104 228 Q108 198 138 204 Q196 226 236 262 Q282 266 322 292 Q326 306 306 306 Q248 303 196 288 Q148 270 108 256 Z"
              fill={`url(#a${u})`}
            />
            <path
              d="M118 214 Q158 176 208 238"
              stroke={c.dark}
              strokeWidth="9"
              fill="none"
              strokeLinecap="round"
            />
            <circle cx="176" cy="196" r="7" fill={GOLD} />
            <path
              d="M236 262 Q282 268 322 292"
              stroke={c.deep}
              strokeOpacity=".4"
              strokeWidth="3"
              fill="none"
            />
          </>
        );

      case 'tote':
        return (
          <>
            <defs>
              {lin('a' + u, c.light, c.main)}
              {lin('b' + u, c.main, c.dark)}
            </defs>
            <path
              d="M150 176 Q150 96 200 96 Q250 96 250 176"
              fill="none"
              stroke={c.dark}
              strokeWidth="12"
              strokeLinecap="round"
            />
            <path d="M290 172 L330 188 L316 330 L306 322 Z" fill={c.deep} opacity=".4" />
            <path d="M112 172 L288 172 L306 322 Q200 342 94 322 Z" fill={`url(#b${u})`} />
            <rect x="110" y="166" width="180" height="16" rx="6" fill={c.dark} />
            <path
              d="M126 200 H274 M120 306 Q200 322 280 306"
              stroke={c.light}
              strokeOpacity=".55"
              strokeWidth="2.5"
              strokeDasharray="6 6"
              fill="none"
            />
            <rect x="170" y="232" width="60" height="38" rx="7" fill={c.deep} />
            <text
              x="200"
              y="258"
              textAnchor="middle"
              fontSize="20"
              fontWeight="800"
              fill={GOLD}
              fontFamily="var(--font-display), system-ui, sans-serif"
            >
              Mi
            </text>
          </>
        );

      case 'crossbody':
        return (
          <>
            <defs>
              {lin('a' + u, c.main, c.dark)}
              {lin('b' + u, c.light, c.main)}
            </defs>
            <path
              d="M126 196 Q130 70 200 70 Q270 70 274 196"
              fill="none"
              stroke={GOLD}
              strokeWidth="7"
              strokeDasharray="1 9"
              strokeLinecap="round"
            />
            <rect x="104" y="190" width="192" height="116" rx="22" fill={`url(#a${u})`} />
            <path
              d="M104 212 Q104 190 126 190 L274 190 Q296 190 296 212 L296 236 Q200 280 104 236 Z"
              fill={`url(#b${u})`}
            />
            <path
              d="M118 304 Q200 318 282 304"
              stroke={c.deep}
              strokeOpacity=".3"
              strokeWidth="3"
              fill="none"
            />
            <circle cx="200" cy="252" r="12" fill={GOLD} />
            <circle cx="200" cy="252" r="5" fill={c.deep} opacity=".6" />
            <path
              d="M118 218 Q200 262 282 218"
              stroke={c.deep}
              strokeOpacity=".25"
              strokeWidth="2.5"
              strokeDasharray="5 5"
              fill="none"
            />
          </>
        );

      case 'necklace':
        return (
          <>
            <defs>
              <radialGradient id={`r${u}`} cx=".35" cy=".3">
                <stop offset="0" stopColor="#fff" />
                <stop offset="1" stopColor={c.light} />
              </radialGradient>
            </defs>
            <g fill="none" stroke={c.main} strokeLinecap="round">
              <path d="M108 112 Q200 336 292 112" strokeWidth="5" strokeDasharray="1 7" />
              <path d="M124 112 Q200 292 276 112" strokeWidth="5" strokeDasharray="1 7" />
              <path d="M140 112 Q200 250 260 112" strokeWidth="5" strokeDasharray="1 7" />
            </g>
            <g fill={c.dark}>
              <circle cx="108" cy="112" r="6" />
              <circle cx="292" cy="112" r="6" />
            </g>
            <circle cx="200" cy="226" r="17" fill={c.dark} />
            <circle cx="200" cy="226" r="12" fill={`url(#r${u})`} />
            <circle cx="200" cy="206" r="7" fill={`url(#r${u})`} stroke={c.main} strokeWidth="2" />
            <circle cx="200" cy="186" r="5" fill={c.main} />
          </>
        );

      case 'earrings':
        return (
          <>
            <defs>
              <radialGradient id={`r${u}`} cx=".35" cy=".3">
                <stop offset="0" stopColor="#fff" />
                <stop offset=".7" stopColor="#ebe3f7" />
                <stop offset="1" stopColor="#b9a9d6" />
              </radialGradient>
            </defs>
            {[146, 254].map((x) => (
              <g key={x}>
                <circle cx={x} cy="112" r="9" fill={c.main} />
                <path d={`M${x} 121 L${x} 176`} stroke={c.main} strokeWidth="4" />
                <circle cx={x} cy="184" r="8" fill={c.main} />
                <circle cx={x} cy="232" r="38" fill={`url(#r${u})`} />
                <ellipse
                  cx={x - 12}
                  cy="218"
                  rx="10"
                  ry="7"
                  fill="#fff"
                  opacity=".8"
                  transform={`rotate(-30 ${x - 12} 218)`}
                />
              </g>
            ))}
          </>
        );

      case 'ring':
        return (
          <>
            <defs>{lin('a' + u, c.light, c.dark)}</defs>
            <circle cx="146" cy="236" r="52" fill="none" stroke={`url(#a${u})`} strokeWidth="15" />
            <circle cx="254" cy="236" r="52" fill="none" stroke={`url(#a${u})`} strokeWidth="15" />
            <circle cx="200" cy="140" r="38" fill="none" stroke={c.main} strokeWidth="10" opacity=".95" />
            <path
              d="M146 168 l-16 -20 l10 -16 h12 l10 16 z"
              fill="#ede9fe"
              stroke={c.dark}
              strokeWidth="3"
            />
            <path
              d="M130 148 h32 M140 132 l6 16 l6 -16"
              stroke={c.dark}
              strokeWidth="2"
              fill="none"
            />
            <circle cx="254" cy="176" r="12" fill={c.deep} opacity=".85" />
            <circle cx="254" cy="176" r="7" fill="#c4b5fd" />
          </>
        );

      case 'watch':
        return (
          <>
            <defs>{lin('a' + u, '#f2effa', '#a9a2bd')}</defs>
            <rect x="166" y="48" width="68" height="110" rx="18" fill={c.main} />
            <rect x="166" y="242" width="68" height="110" rx="18" fill={c.main} />
            <g fill={c.deep} opacity=".45">
              <circle cx="200" cy="300" r="4" />
              <circle cx="200" cy="318" r="4" />
              <circle cx="200" cy="336" r="4" />
            </g>
            <rect x="262" y="176" width="14" height="30" rx="6" fill="#8e88a1" />
            <rect x="136" y="134" width="130" height="132" rx="38" fill={`url(#a${u})`} />
            <rect x="146" y="144" width="110" height="112" rx="30" fill="#07030d" />
            <circle cx="201" cy="200" r="38" fill="none" stroke="#2a1b4d" strokeWidth="7" />
            <path
              d="M201 162 A38 38 0 1 1 164 214"
              fill="none"
              stroke="#a78bfa"
              strokeWidth="7"
              strokeLinecap="round"
            />
            <text
              x="201"
              y="208"
              textAnchor="middle"
              fontSize="26"
              fontWeight="700"
              fill="#fff"
              fontFamily="var(--font-display), system-ui, sans-serif"
            >
              10:09
            </text>
            <text
              x="201"
              y="228"
              textAnchor="middle"
              fontSize="10"
              fill="#c4b5fd"
              fontFamily="var(--font-body), system-ui, sans-serif"
              letterSpacing="1"
            >
              ULTRA 2
            </text>
          </>
        );

      case 'ledpanel':
        return (
          <>
            <defs>
              <radialGradient id={`g${u}`} cx=".5" cy=".5">
                <stop offset="0" stopColor="#fff6d6" />
                <stop offset="1" stopColor="#ffd978" />
              </radialGradient>
              <pattern id={`p${u}`} width="9" height="9" patternUnits="userSpaceOnUse">
                <circle cx="4.5" cy="4.5" r="1.6" fill="#fff" opacity=".7" />
              </pattern>
              <radialGradient id={`h${u}`}>
                <stop offset="0" stopColor="#ffe9a8" stopOpacity=".55" />
                <stop offset="1" stopColor="#ffe9a8" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx="200" cy="170" r="170" fill={`url(#h${u})`} />
            <path
              d="M200 256 L140 350 M200 256 L260 350 M200 256 L200 350"
              stroke={c.main}
              strokeWidth="8"
              strokeLinecap="round"
            />
            <rect x="190" y="236" width="20" height="36" rx="6" fill={c.dark} />
            <rect
              x="86"
              y="92"
              width="228"
              height="150"
              rx="14"
              fill={c.deep === '#000000' ? '#17111f' : c.deep}
            />
            <rect x="98" y="104" width="204" height="126" rx="8" fill={`url(#g${u})`} />
            <rect x="98" y="104" width="204" height="126" rx="8" fill={`url(#p${u})`} />
            <rect x="156" y="78" width="88" height="18" rx="6" fill={c.dark} />
            <circle cx="270" cy="244" r="7" fill="#a78bfa" />
            <circle cx="130" cy="244" r="7" fill="#a78bfa" />
          </>
        );

      case 'earbuds':
        return (
          <>
            <defs>{lin('a' + u, c.light, c.main)}</defs>
            <g>
              <rect x="122" y="52" width="38" height="34" rx="17" transform="rotate(-8 141 69)" fill={c.main} />
              <rect x="132" y="82" width="16" height="64" rx="8" transform="rotate(-8 141 114)" fill={c.main} />
              <circle cx="134" cy="76" r="7" fill={c.deep} opacity=".5" />
            </g>
            <g>
              <rect x="240" y="52" width="38" height="34" rx="17" transform="rotate(8 259 69)" fill={c.main} />
              <rect x="252" y="82" width="16" height="64" rx="8" transform="rotate(8 259 114)" fill={c.main} />
              <circle cx="266" cy="76" r="7" fill={c.deep} opacity=".5" />
            </g>
            <rect x="96" y="166" width="208" height="150" rx="56" fill={`url(#a${u})`} />
            <path d="M96 222 Q200 244 304 222" stroke={c.deep} strokeOpacity=".3" strokeWidth="3" fill="none" />
            <circle cx="200" cy="270" r="7" fill="#a78bfa" />
          </>
        );

      case 'powerbank':
        return (
          <>
            <defs>{lin('a' + u, c.light, c.main)}</defs>
            <rect x="122" y="56" width="156" height="292" rx="34" fill={`url(#a${u})`} />
            <rect x="142" y="82" width="116" height="52" rx="14" fill="#07030d" />
            <g fill="#a78bfa">
              <circle cx="166" cy="108" r="6" />
              <circle cx="188" cy="108" r="6" />
              <circle cx="210" cy="108" r="6" />
            </g>
            <circle cx="232" cy="108" r="6" fill="#4b3a78" />
            <text
              x="200"
              y="208"
              textAnchor="middle"
              fontSize="31"
              fontWeight="800"
              fill={c.deep}
              fontFamily="var(--font-display), system-ui, sans-serif"
            >
              20000
            </text>
            <text
              x="200"
              y="232"
              textAnchor="middle"
              fontSize="13"
              fontWeight="700"
              fill={c.deep}
              opacity=".7"
              letterSpacing="3"
              fontFamily="var(--font-body), system-ui, sans-serif"
            >
              mAh
            </text>
            <rect x="164" y="300" width="22" height="9" rx="3" fill={c.deep} opacity=".7" />
            <rect x="214" y="300" width="22" height="9" rx="3" fill={c.deep} opacity=".7" />
          </>
        );

      case 'pot':
        return (
          <>
            <defs>
              {lin('a' + u, c.light, c.dark)}
              {lin('b' + u, c.main, c.deep)}
            </defs>
            <rect x="104" y="170" width="192" height="130" rx="14" fill={`url(#b${u})`} />
            <rect x="90" y="190" width="18" height="14" rx="5" fill={c.deep} />
            <rect x="292" y="190" width="18" height="14" rx="5" fill={c.deep} />
            <path
              d="M98 172 Q200 108 302 172 Z"
              fill={c.light}
              opacity=".35"
              stroke={c.light}
              strokeWidth="4"
            />
            <circle cx="200" cy="130" r="11" fill={c.deep} />
            <rect x="46" y="238" width="112" height="82" rx="12" fill={`url(#a${u})`} />
            <path
              d="M42 240 Q102 204 162 240 Z"
              fill={c.light}
              opacity=".4"
              stroke={c.light}
              strokeWidth="3"
            />
            <circle cx="102" cy="214" r="7" fill={c.deep} />
            <path d="M214 276 L318 276 L312 316 Q266 326 224 316 Z" fill={c.deep} />
            <path d="M316 288 L372 284" stroke={c.deep} strokeWidth="12" strokeLinecap="round" />
            <path
              d="M118 190 L118 280"
              stroke="#fff"
              strokeOpacity=".18"
              strokeWidth="8"
              strokeLinecap="round"
            />
          </>
        );

      case 'spoons':
        return (
          <>
            <defs>
              <linearGradient id={`w${u}`} x1="0" x2="1">
                <stop offset="0" stopColor="#e9cfa4" />
                <stop offset="1" stopColor="#c79c64" />
              </linearGradient>
            </defs>
            {[
              [92, 160],
              [146, 164],
              [200, 160],
              [254, 164],
              [308, 160],
            ].map(([x, y]) => (
              <rect
                key={x}
                x={x - 8}
                y={y}
                width="16"
                height={346 - y}
                rx="8"
                fill={`url(#w${u})`}
              />
            ))}
            <ellipse cx="92" cy="120" rx="27" ry="34" fill={c.main} />
            <ellipse cx="92" cy="122" rx="17" ry="24" fill={c.deep} opacity=".35" />
            <rect x="120" y="70" width="52" height="94" rx="12" fill={c.main} />
            <g fill={c.deep} opacity=".45">
              <rect x="130" y="82" width="8" height="48" rx="4" />
              <rect x="146" y="82" width="8" height="48" rx="4" />
            </g>
            <ellipse cx="200" cy="108" rx="24" ry="40" fill={c.main} />
            <ellipse cx="200" cy="108" rx="14" ry="30" fill={c.deep} opacity=".35" />
            <path d="M232 164 L240 70 Q254 62 272 70 L278 164 Z" fill={c.main} />
            <path
              d="M252 82 V120"
              stroke={c.deep}
              strokeOpacity=".45"
              strokeWidth="6"
              strokeLinecap="round"
            />
            <circle cx="308" cy="116" r="30" fill={c.main} />
            <g fill={c.deep} opacity=".45">
              <circle cx="298" cy="108" r="4" />
              <circle cx="314" cy="104" r="4" />
              <circle cx="306" cy="122" r="4" />
              <circle cx="322" cy="120" r="4" />
            </g>
            <g fill={c.light} opacity=".3">
              <ellipse cx="82" cy="108" rx="5" ry="12" />
              <ellipse cx="190" cy="92" rx="4" ry="12" />
            </g>
          </>
        );

      case 'bottles':
        return (
          <>
            <defs>
              <linearGradient id={`p${u}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={c.light} />
                <stop offset=".55" stopColor={c.main} />
                <stop offset="1" stopColor={c.dark} />
              </linearGradient>
            </defs>
            {[
              { x: 62, y: 90, w: 96, r: 26, ticks: 7 },
              { x: 170, y: 138, w: 66, r: 22, ticks: 5 },
              { x: 248, y: 190, w: 56, r: 18, ticks: 4 },
              { x: 316, y: 238, w: 44, r: 14, ticks: 3 },
            ].map(({ x, y, w, r, ticks }, idx) => (
              <g key={idx}>
                <rect x={x + w * 0.25} y={y - 20} width={w * 0.5} height="24" rx="6" fill={c.deep} />
                <rect x={x} y={y} width={w} height={338 - y} rx={r} fill={`url(#p${u})`} />
                <g stroke="#fff" strokeOpacity=".6" strokeWidth="2.5" strokeLinecap="round">
                  {Array.from({ length: ticks }, (_, i) => (
                    <path
                      key={i}
                      d={`M${x + w * 0.58} ${y + 34 + i * ((330 - y - 60) / ticks)} H${x + w * 0.84}`}
                    />
                  ))}
                </g>
              </g>
            ))}
          </>
        );

      case 'basket':
        return (
          <>
            <defs>
              {lin('a' + u, c.light, c.dark)}
              <pattern id={`w${u}`} width="18" height="12" patternUnits="userSpaceOnUse">
                <path
                  d="M0 6 H18 M9 0 V12"
                  stroke={c.deep}
                  strokeOpacity=".28"
                  strokeWidth="2"
                />
              </pattern>
            </defs>
            <path
              d="M104 190 L296 190 L278 328 Q200 340 122 328 Z"
              fill={`url(#a${u})`}
            />
            <path
              d="M104 190 L296 190 L278 328 Q200 340 122 328 Z"
              fill={`url(#w${u})`}
            />
            <ellipse cx="200" cy="190" rx="98" ry="22" fill={c.dark} />
            <ellipse cx="200" cy="190" rx="86" ry="15" fill={c.deep} opacity=".8" />
            <path
              d="M130 188 Q150 130 200 138 Q250 130 270 188 Z"
              fill={PAL.lilac.light}
            />
            <path d="M150 186 Q170 150 200 156" stroke={PAL.lilac.main} strokeWidth="4" fill="none" />
            <path
              d="M92 214 Q76 232 94 250 M308 214 Q324 232 306 250"
              stroke={c.dark}
              strokeWidth="9"
              fill="none"
              strokeLinecap="round"
            />
          </>
        );

      case 'cushion':
        return (
          <>
            <defs>
              {lin('a' + u, c.light, c.main)}
              {lin('b' + u, c.main, c.dark)}
            </defs>
            <g transform="rotate(-12 200 200) translate(-36 -10)">
              <path
                d="M118 118 Q200 96 282 118 Q300 200 282 282 Q200 304 118 282 Q100 200 118 118 Z"
                fill={`url(#b${u})`}
                opacity=".92"
              />
            </g>
            <g transform="translate(26 10)">
              <path
                d="M110 112 Q192 90 274 112 Q292 194 274 276 Q192 298 110 276 Q92 194 110 112 Z"
                fill={`url(#a${u})`}
              />
              <g stroke={c.deep} strokeOpacity=".35" strokeWidth="3" fill="none" strokeLinecap="round">
                <path d="M192 194 L120 124 M192 194 L266 124 M192 194 L120 268 M192 194 L266 268" />
              </g>
              <circle cx="192" cy="194" r="11" fill={c.dark} />
            </g>
          </>
        );

      case 'candles':
        return (
          <>
            {[
              { x: 74, w: 86, h: 170, i: 0 },
              { x: 172, w: 76, h: 118, i: 1 },
              { x: 260, w: 70, h: 80, i: 0 },
            ].map(({ x, w, h, i }, idx) => (
              <g key={idx}>
                <rect
                  x={x}
                  y={338 - h}
                  width={w}
                  height={h}
                  rx="14"
                  fill={i ? c.main : c.light}
                />
                <rect x={x - 2} y={338 - h - 14} width={w + 4} height="20" rx="6" fill={GOLD} />
                <rect
                  x={x + w * 0.18}
                  y={338 - h * 0.72}
                  width={w * 0.64}
                  height={h * 0.34}
                  rx="6"
                  fill="#fff"
                  opacity=".85"
                />
                <path d={`M${x + w / 2} ${338 - h - 16} v-14`} stroke="#2a2138" strokeWidth="3" />
                <path
                  d={`M${x + w / 2} ${338 - h - 32} q-9 -16 0 -30 q9 14 0 30z`}
                  fill="#ffb84d"
                />
              </g>
            ))}
          </>
        );

      case 'perfume':
        return (
          <>
            <defs>
              {lin('a' + u, c.light, c.main)}
              {lin('b' + u, c.main, c.dark)}
              {lin('t' + u, c.dark, c.deep)}
            </defs>
            <rect x="56" y="270" width="288" height="70" rx="12" fill={`url(#t${u})`} />
            <rect x="190" y="270" width="20" height="70" fill={GOLD} />
            <rect x="76" y="132" width="66" height="144" rx="10" fill="#fff" opacity=".9" />
            <rect x="82" y="168" width="54" height="102" rx="6" fill={`url(#a${u})`} />
            <rect x="92" y="108" width="34" height="28" rx="5" fill={c.deep} />
            <circle cx="204" cy="212" r="56" fill={`url(#b${u})`} opacity=".95" />
            <circle cx="204" cy="212" r="56" fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth="3" />
            <rect x="188" y="130" width="32" height="30" rx="6" fill={GOLD} />
            <rect x="170" y="196" width="68" height="34" rx="6" fill="#fff" opacity=".85" />
            <rect x="274" y="156" width="54" height="120" rx="8" fill={`url(#a${u})`} />
            <rect x="266" y="130" width="70" height="30" rx="6" fill={c.deep} />
            <path
              d="M286 176 V260"
              stroke="#fff"
              strokeOpacity=".6"
              strokeWidth="6"
              strokeLinecap="round"
            />
          </>
        );

      case 'gummies':
        return (
          <>
            {[104, 212].map((x) => (
              <g key={x}>
                <rect x={x} y="82" width="86" height="36" rx="10" fill="#fff" />
                <rect x={x - 6} y="110" width="98" height="226" rx="22" fill={c.main} />
                <rect x={x + 2} y="162" width="82" height="118" rx="14" fill="#fff" opacity=".92" />
                <text
                  x={x + 43}
                  y="204"
                  textAnchor="middle"
                  fontSize="22"
                  fontWeight="800"
                  fill={c.dark}
                  fontFamily="var(--font-display), system-ui, sans-serif"
                >
                  HAIR
                </text>
                <text
                  x={x + 43}
                  y="228"
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="700"
                  fill={c.dark}
                  letterSpacing="2"
                  fontFamily="var(--font-body), system-ui, sans-serif"
                >
                  GUMMIES
                </text>
                <circle cx={x + 43} cy="256" r="8" fill="#ef4444" />
              </g>
            ))}
          </>
        );

      case 'nailkit':
        return (
          <>
            <defs>
              {lin('a' + u, '#fff', '#b3adc4')}
              {lin('b' + u, c.main, c.dark)}
            </defs>
            <rect x="86" y="130" width="228" height="180" rx="30" fill={`url(#b${u})`} />
            <path
              d="M86 176 H314"
              stroke={c.deep}
              strokeOpacity=".3"
              strokeWidth="3"
              strokeDasharray="3 6"
            />
            <g>
              <rect x="118" y="82" width="20" height="170" rx="10" fill={`url(#a${u})`} />
              <rect x="156" y="62" width="20" height="190" rx="10" fill={`url(#a${u})`} />
              <path d="M168 62 l-8 -16 h16 z" fill="#b3adc4" />
              <rect x="194" y="94" width="20" height="158" rx="10" fill={`url(#a${u})`} />
              <rect x="232" y="76" width="20" height="176" rx="10" fill={`url(#a${u})`} />
            </g>
            <path
              d="M270 84 Q300 160 270 238 L282 238 Q316 160 282 84 Z"
              fill={`url(#a${u})`}
              opacity=".95"
            />
            <rect x="86" y="214" width="228" height="96" rx="26" fill={c.dark} />
            <path
              d="M104 236 H296"
              stroke={c.light}
              strokeOpacity=".5"
              strokeWidth="3"
              strokeDasharray="3 7"
            />
            <circle cx="296" cy="236" r="7" fill={GOLD} />
          </>
        );

      default:
        return null;
    }
  };

  // Shadow element
  const shadow = (
    <ellipse
      cx="200"
      cy="350"
      rx="118"
      ry="11"
      fill="#000"
      opacity=".2"
      filter={`url(#sh${u})`}
    />
  );

  // Background defs and layouts
  const defs = (
    <defs>
      <filter id={`sh${u}`} x="-30%" y="-100%" width="160%" height="300%">
        <feGaussianBlur stdDeviation="7" />
      </filter>
      <linearGradient id={`bg${u}`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="var(--art-a, #f4edff)" />
        <stop offset="1" stopColor="var(--art-b, #e3d4ff)" />
      </linearGradient>
      <pattern
        id={`st${u}`}
        width="22"
        height="22"
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(40)"
      >
        <rect width="9" height="22" fill="var(--art-c, #d2bbff)" opacity=".45" />
      </pattern>
    </defs>
  );

  let bg = null;
  let tf = 'translate(0, 0)';

  if (view === 'bare') {
    bg = null;
    tf = 'translate(0, 0)';
  } else if (view === 0) {
    bg = (
      <>
        <rect width="400" height="400" fill={`url(#bg${u})`} />
        <circle cx="200" cy="196" r="150" fill="var(--art-c, #d2bbff)" opacity=".55" />
      </>
    );
    tf = 'translate(0, -6)';
  } else if (view === 1) {
    bg = (
      <>
        <rect width="400" height="400" fill={`url(#bg${u})`} />
        <path
          d="M96 400 V176 a104 104 0 0 1 208 0 V400 Z"
          fill="var(--art-c, #d2bbff)"
          opacity=".7"
        />
        <circle cx="318" cy="84" r="26" fill="var(--art-c, #d2bbff)" />
      </>
    );
    tf = 'translate(200, 210) scale(.9) translate(-200, -210)';
  } else if (view === 2) {
    bg = (
      <>
        <rect width="400" height="400" fill={`url(#bg${u})`} />
        <rect width="400" height="400" fill={`url(#st${u})`} />
      </>
    );
    tf = 'translate(200, 205) rotate(-5) scale(.94) translate(-200, -205)';
  } else {
    // view === 3 (zoom)
    bg = (
      <>
        <rect width="400" height="400" fill={`url(#bg${u})`} />
        <circle cx="90" cy="90" r="70" fill="var(--art-c, #d2bbff)" opacity=".6" />
        <circle cx="340" cy="330" r="90" fill="var(--art-c, #d2bbff)" opacity=".45" />
      </>
    );
    tf = 'translate(200, 215) scale(1.7) translate(-200, -212)';
  }

  return (
    <svg
      viewBox="0 0 400 400"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={ariaLabel || `${type} illustration`}
      preserveAspectRatio="xMidYMid slice"
      className={className}
      style={{ display: 'block', width: '100%', height: '100%' }}
    >
      {defs}
      {bg}
      {view !== 'bare' && view !== 3 && shadow}
      <g transform={tf}>{renderShape()}</g>
    </svg>
  );
};
