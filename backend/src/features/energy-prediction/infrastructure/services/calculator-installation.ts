/** Existing calculator sizing rule; surface is the user-selected usable roof footprint. */
export function calculatorInstallation(areaM2: number, tilt: number, azimuth: number, panels?: number) {
  const flat = tilt < 5;
  const kwp = Math.round((areaM2 * 0.8 / (flat ? 9 : 6)) * 10) / 10;
  return { kwp, tilt: flat ? 20 : tilt, azimuth: flat ? 0 : azimuth,
    panelCount: panels || Math.ceil(kwp / 0.45) };
}
