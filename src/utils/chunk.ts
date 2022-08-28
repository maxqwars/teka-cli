export default function chunk(str: string, n) {
  const ret: string[] = [];
  const length = str.length;

  for (let i = 0; i < length; i += n) {
    ret.push(str.substring(i, n));
  }

  return ret;
}
