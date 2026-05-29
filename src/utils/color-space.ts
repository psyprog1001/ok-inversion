/**
 * OKLab color space utilities for hue inversion and gamut mapping.
 * Based on Björn Ottosson's OKLab specification.
 */

export type RGB = [number, number, number];
export type OKLab = [number, number, number];

// sRGB to Linear sRGB
const srgbToLinear = (c: number): number => {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
};

// Linear sRGB to sRGB
const linearToSrgb = (c: number): number => {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
};

export const rgbToOklab = (r: number, g: number, b: number): OKLab => {
  const lr = srgbToLinear(r / 255);
  const lg = srgbToLinear(g / 255);
  const lb = srgbToLinear(b / 255);

  const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
  const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
  const s = 0.0883024619 * lr + 0.2817188501 * lg + 0.6299787 * lb;

  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  return [
    0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
  ];
};

export const oklabToLinearRgb = (L: number, a: number, b: number): RGB => {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  return [
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
};

/**
 * Checks if a linear RGB color is within the [0, 1] gamut.
 */
const isInGamut = (rgb: RGB): boolean => {
  return rgb.every((c) => c >= -0.0001 && c <= 1.0001);
};

/**
 * Scales chroma down until the color fits in the sRGB gamut,
 * preserving lightness and hue in OKLab space.
 */
export const gamutMap = (L: number, a: number, b: number): RGB => {
  let rgb = oklabToLinearRgb(L, a, b);
  if (isInGamut(rgb)) return rgb;

  // Binary search for the maximum chroma that fits in gamut
  let low = 0;
  let high = 1;
  let bestA = 0;
  let bestB = 0;

  for (let i = 0; i < 10; i++) {
    const mid = (low + high) / 2;
    const curA = a * mid;
    const curB = b * mid;
    const curRgb = oklabToLinearRgb(L, curA, curB);

    if (isInGamut(curRgb)) {
      bestA = curA;
      bestB = curB;
      rgb = curRgb;
      low = mid;
    } else {
      high = mid;
    }
  }

  return rgb;
};

export const linearToSrgbUint8 = (rgb: RGB): [number, number, number] => {
  return rgb.map((c) =>
    Math.max(0, Math.min(255, Math.round(linearToSrgb(c) * 255))),
  ) as [number, number, number];
};