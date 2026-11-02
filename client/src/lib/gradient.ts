/**
 * Generate a deterministic gradient CSS string from an outlet name.
 * Uses a simple hash so the same outlet always gets the same gradient.
 */
export function outletGradient(outlet: string): string {
  let hash = 0;
  for (let i = 0; i < outlet.length; i++) {
    hash = (hash * 31 + outlet.charCodeAt(i)) | 0;
  }

  const hue1 = Math.abs(hash) % 360;
  const hue2 = (hue1 + 40) % 360;
  const sat = 40 + (Math.abs(hash >> 8) % 30);
  const light1 = 20 + (Math.abs(hash >> 16) % 20);
  const light2 = 35 + (Math.abs(hash >> 24) % 20);

  return `linear-gradient(135deg, hsl(${hue1},${sat}%,${light1}%) 0%, hsl(${hue2},${sat}%,${light2}%) 100%)`;
}
