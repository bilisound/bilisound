export function simpleCopy<T>(input: T): T {
    return JSON.parse(JSON.stringify(input));
}

export function padArrayToColumns<T>(array: T[], columns: number): (T | null)[] {
    if (columns <= 0) return array.slice();

    const remainder = array.length % columns;
    if (remainder === 0) return array.slice();

    const paddingCount = columns - remainder;
    return [...array, ...Array(paddingCount).fill(null)];
}
