export const TEXT_MENU = ["xs", "sm", "md", "lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl", "display"];
export const RADIUS_MENU = ["none", "sm", "md", "lg", "xl", "2xl", "3xl", "full", "pill"];
export const DURATION_MENU = ["100", "150", "200", "300", "450", "600"];
export const Z_LADDER = ["raised", "nav", "drawer", "modal", "toast", "tooltip"];

export const SPACING_STANDARD_PX = {
  0: 0, "0.5": 2, 1: 4, "1.5": 6, 2: 8, "2.5": 10, 3: 12, "3.5": 14, 4: 16,
  5: 20, 6: 24, 7: 28, 8: 32, 9: 36, 10: 40, 11: 44, 12: 48, 14: 56, 16: 64, 20: 80, 24: 96,
};

export function toPx(v) {
  const s = String(v).trim().toLowerCase();
  const m = s.match(/^(-?[\d.]+)(px|rem)?$/);
  if (!m) return null;
  const n = parseFloat(m[1]);
  if (!Number.isFinite(n)) return null;
  return m[2] === "rem" ? n * 16 : n;
}

export const onSpacingGrid = (px) => px === 2 || px === 0 || Math.abs(px % 4) < 1e-9;

export const isTokenRef = (v) => /var\(\s*--(?:m|color|radius|shadow|ease|font|text)-[\w-]+\s*\)/.test(String(v));
