/**
 * Heap Sort implementation for prioritizing objects.
 * This is a max-heap implementation to bring highest priority items to the top.
 */

export function heapSort<T>(array: T[], compare: (a: T, b: T) => number): T[] {
  const arr = [...array];
  const n = arr.length;

  // Build heap (rearrange array)
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    heapify(arr, n, i, compare);
  }

  // One by one extract an element from heap
  for (let i = n - 1; i > 0; i--) {
    // Move current root to end
    [arr[0], arr[i]] = [arr[i], arr[0]];

    // call max heapify on the reduced heap
    heapify(arr, i, 0, compare);
  }

  return arr;
}

function heapify<T>(arr: T[], n: number, i: number, compare: (a: T, b: T) => number): void {
  let largest = i; // Initialize largest as root
  const left = 2 * i + 1;
  const right = 2 * i + 2;

  // If left child is larger than root
  if (left < n && compare(arr[left], arr[largest]) > 0) {
    largest = left;
  }

  // If right child is larger than largest so far
  if (right < n && compare(arr[right], arr[largest]) > 0) {
    largest = right;
  }

  // If largest is not root
  if (largest !== i) {
    [arr[i], arr[largest]] = [arr[largest], arr[i]];

    // Recursively heapify the affected sub-tree
    heapify(arr, n, largest, compare);
  }
}
