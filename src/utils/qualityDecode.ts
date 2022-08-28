export default function qualityDecode(count: number) {
  if (count > 1000) {
    return Math.round((count as number) / 1000) + "K";
  }

  return count;
}
