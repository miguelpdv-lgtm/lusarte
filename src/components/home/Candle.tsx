// Vela ondulada del manual, dibujada en plano: crema troquelado + contorno carbón, como los stickers.
const TOP = 120;
const BOTTOM = 300;
const LEFT = 62;
const RIGHT = 158;

/** Un costado ondulado de la vela (3 ondas de arriba a abajo). */
function side(x: number, dir: 1 | -1) {
  return Array.from({ length: 41 }, (_, i) => {
    const t = i / 40;
    const y = TOP + (BOTTOM - TOP) * t;
    return `${(x + dir * 7 * Math.sin(t * Math.PI * 6)).toFixed(1)} ${y.toFixed(1)}`;
  });
}

const left = side(LEFT, -1);
const right = side(RIGHT, 1).reverse();
const body = `M${left.join(" L")} Q110 ${BOTTOM + 14} ${right[0]} L${right.join(" L")} Q110 ${TOP - 14} ${left[0]} Z`;

type Props = {
  lit: boolean;
  /** Ya estuvo encendida: al apagarla sale humo */
  wasLit: boolean;
  onToggle: () => void;
  className?: string;
};

export function Candle({ lit, wasLit, onToggle, className = "" }: Props) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={lit}
      aria-label={lit ? "Apagar la vela" : "Encender la vela"}
      className={`cursor-pointer rounded-3xl ${className}`}
    >
      <svg viewBox="0 0 220 340" className="block h-auto w-full overflow-visible" aria-hidden="true">
        <circle
          cx="110"
          cy="72"
          r="70"
          className={`fill-estrella transition-opacity duration-700 ${lit ? "opacity-40" : "opacity-0"}`}
        />

        {/* Platito */}
        <ellipse cx="110" cy="312" rx="92" ry="20" className="fill-crema stroke-crema" strokeWidth="14" />
        <ellipse cx="110" cy="312" rx="92" ry="20" className="fill-arena stroke-carbon" strokeWidth="4" />

        {/* Cuerpo: primero el borde troquelado crema, encima la vela */}
        <path d={body} fill="none" className="stroke-crema" strokeWidth="16" strokeLinejoin="round" />
        <path d={body} className="fill-crema stroke-carbon" strokeWidth="4" strokeLinejoin="round" />
        <path d="M78 150 Q80 200 76 250" fill="none" className="stroke-white" strokeWidth="6" strokeLinecap="round" opacity=".7" />

        {/* Mecha (con borde crema para que se vea a oscuras) */}
        <path d="M110 108 Q112 96 108 88" fill="none" className="stroke-crema" strokeWidth="10" strokeLinecap="round" />
        <path d="M110 108 Q112 96 108 88" fill="none" className="stroke-carbon" strokeWidth="4.5" strokeLinecap="round" />

        {/* Llama: crece al encender y titila */}
        <g
          className={`origin-bottom transition-transform duration-500 [transform-box:fill-box] ${lit ? "scale-100" : "scale-0"}`}
        >
          <g className="origin-bottom animate-llama [transform-box:fill-box]">
            <path
              d="M110 30 C126 52 132 70 124 84 C118 94 102 94 96 84 C88 70 96 52 110 30 Z"
              className="fill-miel stroke-carbon"
              strokeWidth="4"
              strokeLinejoin="round"
            />
            <path d="M110 56 C117 66 118 76 114 82 C111 86 109 86 106 82 C102 76 104 66 110 56 Z" className="fill-estrella" />
          </g>
        </g>

        {/* Humo al apagarla */}
        {!lit && wasLit && (
          <path
            d="M108 84 C100 70 118 62 108 46 C100 34 114 26 108 14"
            fill="none"
            className="animate-humo stroke-carbon-suave"
            strokeWidth="3"
            strokeLinecap="round"
          />
        )}
      </svg>
    </button>
  );
}
