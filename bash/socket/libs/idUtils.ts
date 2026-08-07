/**
 * Creates an ID generator matching the broker format (13 digits + _ + 5 digits).
 */
export function createIdGenerator() {
  let lastValue = 0;
  let counter = 0;

  return function nextId() {
    const value = new Date().getTime();
    if (value === lastValue) {
      counter += 1;
    } else {
      lastValue = value;
      counter = 1;
    }

    return `${value}_${String(counter).padStart(5, "0")}`;
  };
}

/**
 * Parses an ID string formatted as "<segment1>_<segment2>" into numerical components.
 * Returns null if parsing fails.
 *
 * @param id ID string such as "1786055195162_00001"
 */
export function parseId(id: string | null): { seg1: number; seg2: number } | null {
  if (!id) {
    return null;
  }
  const parts = id.split("_");
  if (parts.length !== 2) {
    return null;
  }
  const seg1 = Number(parts[0]);
  const seg2 = Number(parts[1]);
  if (Number.isNaN(seg1) || Number.isNaN(seg2)) {
    return null;
  }
  return { seg1, seg2 };
}

/**
 * Compares incoming ID against a reference ID.
 * Returns true if incoming ID is strictly newer than reference ID.
 *
 * Rule:
 * 1. If reference ID is null/empty, incoming ID is considered newer.
 * 2. Compare first segment (numeric timestamp / sequence).
 * 3. If first segments are equal, compare second segment (numeric index).
 *
 * @param incomingId ID extracted from incoming message
 * @param referenceId Reference ID to compare against (e.g. memoryId or last seen ID)
 */
export function isNewer(incomingId: string | null, referenceId: string | null): boolean {
  if (!incomingId) {
    return false;
  }
  if (!referenceId) {
    return true;
  }

  const incomingParsed = parseId(incomingId);
  const referenceParsed = parseId(referenceId);

  // If IDs do not follow segment_segment format, fall back to string comparison
  if (!incomingParsed || !referenceParsed) {
    return incomingId > referenceId;
  }

  if (incomingParsed.seg1 > referenceParsed.seg1) {
    return true;
  }

  if (incomingParsed.seg1 === referenceParsed.seg1 && incomingParsed.seg2 > referenceParsed.seg2) {
    return true;
  }

  return false;
}
