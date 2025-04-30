export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomFrom<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]!;
}

/**
 * Calculates the weight of each object's numeric property as a percentage of the total sum
 * @param objects Array of objects
 * @param key The key of the numeric property to use for weight calculation
 * @returns The same array with an added weight property for each object
 */
export function calculateWeights<T extends object, K extends keyof T>(
  objects: T[],
  key: K
): (T & { weight: number })[] {
  // Type guard to ensure the key points to a numeric property
  if (objects.length > 0 && typeof objects[0]?.[key] !== "number") {
    throw new Error(`Property ${String(key)} must be of type number`);
  }

  // Calculate the total sum of all values for the specified key
  const totalSum = objects.reduce((sum, obj) => sum + (obj[key] as unknown as number), 0);

  // If totalSum is 0, assign equal weights to avoid division by zero
  if (totalSum === 0) {
    return objects.map(obj => ({
      ...obj,
      weight: 1 / objects.length
    }));
  }

  // Calculate the weight of each object as a percentage of the total
  return objects.map(obj => ({
    ...obj,
    weight: (obj[key] as unknown as number) / totalSum
  }));
}

export const percentageFormatter = new Intl.NumberFormat("en-US", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1
});

export const usdAmountFormatter = Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  currencySign: "standard",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const tokenAmountFormatter = Intl.NumberFormat("en-US", {
  currencySign: "standard",
  minimumFractionDigits: 2,
  minimumSignificantDigits: 3
});
