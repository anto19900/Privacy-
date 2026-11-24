import type { Sex } from './types';

/** % di grasso corporeo stimata con la formula della US Navy (misure in cm). */
export function navyBodyFat(sex: Sex, heightCm: number, waist?: number, neck?: number, hips?: number): number | null {
  if (!waist || !neck || !heightCm) return null;
  const inch = (cm: number) => cm / 2.54;
  let bf: number;
  if (sex === 'M') {
    if (waist <= neck) return null;
    bf = 86.01 * Math.log10(inch(waist - neck)) - 70.041 * Math.log10(inch(heightCm)) + 36.76;
  } else {
    if (!hips || waist + hips <= neck) return null;
    bf = 163.205 * Math.log10(inch(waist + hips - neck)) - 97.684 * Math.log10(inch(heightCm)) - 78.387;
  }
  return bf > 2 && bf < 70 ? Math.round(bf * 10) / 10 : null;
}

/** Rapporto vita/altezza: sotto 0,5 è considerato a basso rischio. */
export function waistToHeight(waist: number, heightCm: number): number {
  return waist / heightCm;
}
