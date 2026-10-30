function randomSegment(length: number): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, length).toUpperCase();
}

export function createId(prefix: string): string {
  return `${prefix}_${randomSegment(8).toLowerCase()}`;
}

/** Patient-facing booking reference, e.g. "MB-7K3QPA". */
export function createReference(): string {
  return `MB-${randomSegment(6)}`;
}
