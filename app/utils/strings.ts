export function truncateMiddle(input: string) {
  if (!input) return input;
  return `${input.slice(0, 4)}...${input.slice(
    -4
  )}`;
}
