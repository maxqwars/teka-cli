export default function qualityDecode(count: number) {
  return Math.round((count as number) / 1000) + "K";
}
