export default function decodeTypeCode(code: number) {
  switch (code) {
    default: {
      return "Unknown";
    }
    case 0: {
      return "MOVIE";
    }
    case 1: {
      return "TV";
    }
    case 2: {
      return "OVA";
    }
    case 3: {
      return "ONA";
    }
    case 4: {
      return "SPECIAL";
    }
  }
}
