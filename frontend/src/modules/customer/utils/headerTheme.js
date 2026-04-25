/** Shift hex color channels by amount (negative = darker). */
export function shiftHex(hex, amount) {
  if (!hex || typeof hex !== "string" || !hex.startsWith("#")) return hex;

  const normalized =
    hex.length === 4
      ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
      : hex;

  const value = normalized.slice(1);
  if (value.length !== 6) return hex;

  const clamp = (num) => Math.max(0, Math.min(255, num + amount));
  const r = clamp(parseInt(value.slice(0, 2), 16));
  const g = clamp(parseInt(value.slice(2, 4), 16));
  const b = clamp(parseInt(value.slice(4, 6), 16));

  return `#${[r, g, b]
    .map((channel) => channel.toString(16).padStart(2, "0"))
    .join("")}`;
}

/** Mix two hex colors with a weight t (0.0 to 1.0). */
export function mixHexColors(hex1, hex2, t) {
  const parse = (h) => {
    const norm = h.length === 4 ? `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}` : h;
    return [
      parseInt(norm.slice(1, 3), 16),
      parseInt(norm.slice(3, 5), 16),
      parseInt(norm.slice(5, 7), 16)
    ];
  };

  const [r1, g1, b1] = parse(hex1);
  const [r2, g2, b2] = parse(hex2);

  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);

  return `#${[r, g, b]
    .map((c) => c.toString(16).padStart(2, "0"))
    .join("")}`;
}

const DEFAULT_BASE = "#45B0E2";

/** Blend hex toward white (t=0 base, t≈1 near-white). */
export function mixHexWithWhite(hex, t) {
  if (!hex || typeof hex !== "string" || !hex.startsWith("#")) {
    return "#f8fafc";
  }
  const normalized =
    hex.length === 4
      ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
      : hex;
  const value = normalized.slice(1);
  if (value.length !== 6) return "#f8fafc";

  const mix = (c) => Math.round(c + (255 - c) * t);
  const r = mix(parseInt(value.slice(0, 2), 16));
  const g = mix(parseInt(value.slice(2, 4), 16));
  const b = mix(parseInt(value.slice(4, 6), 16));
  return `#${[r, g, b]
    .map((channel) => channel.toString(16).padStart(2, "0"))
    .join("")}`;
}

/** Search field surface: tinted header theme, a bit darker than near-white. */
export function buildSearchBarBackgroundColor(baseHeaderColor) {
  const base = baseHeaderColor || DEFAULT_BASE;
  return mixHexWithWhite(base, 0.7);
}

/**
 * Same gradient as the main location header (category-driven).
 */
export function buildHeaderGradient(baseHeaderColor, isTop = false) {
  const base = baseHeaderColor || DEFAULT_BASE;
  if (!isTop) return `linear-gradient(180deg, ${base} 0%, ${base} 100%)`;
  
  const top = mixHexWithWhite(base, 0.35); // 35% white highlight
  return `linear-gradient(180deg, ${top} 0%, ${base} 100%)`;
}

/** Solid fill for floating cart pill: header mid tone, slightly darker. */
export function buildMiniCartColor(baseHeaderColor) {
  const base = baseHeaderColor || DEFAULT_BASE;
  const mid = shiftHex(base, 20);
  return shiftHex(mid, -26);
}

/** Gradient for floating mini cart pill (same palette as header, horizontal). */
export function buildMiniCartGradient(baseHeaderColor) {
  const base = baseHeaderColor || DEFAULT_BASE;
  const top = shiftHex(base, -12);
  const mid = shiftHex(base, 20);
  const deep = shiftHex(mid, -32);
  return `linear-gradient(135deg, ${top} 0%, ${mid} 48%, ${deep} 100%)`;
}
