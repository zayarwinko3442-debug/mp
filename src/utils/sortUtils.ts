import { Poster } from '../types';

export type SortMode = 'numeric' | 'year-desc' | 'rating-desc' | 'title-asc' | 'title-desc';

/**
 * Natural numerical string comparator using Unicode Collation Algorithm with numeric: true.
 * Correctly orders "1.jpg", "2.jpg", "10.jpg" instead of "1.jpg", "10.jpg", "2.jpg".
 */
export function naturalCompare(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

/**
 * Compare two posters naturally by numerical file/title order.
 * Considers orderIndex first (if available from Drive batch import), then originalFileName, then title.
 */
export function comparePostersNumerically(a: Poster, b: Poster): number {
  // If explicitly assigned orderIndex
  if (typeof a.orderIndex === 'number' && typeof b.orderIndex === 'number') {
    if (a.orderIndex !== b.orderIndex) {
      return a.orderIndex - b.orderIndex;
    }
  }

  // Compare by original filename if both exist
  if (a.originalFileName && b.originalFileName) {
    const cmp = naturalCompare(a.originalFileName, b.originalFileName);
    if (cmp !== 0) return cmp;
  }

  // Fallback to title comparison with natural numeric sorting
  return naturalCompare(a.title, b.title);
}

/**
 * Sort an array of posters according to the chosen sortMode.
 */
export function sortPosters(posters: Poster[], sortMode: SortMode): Poster[] {
  const list = [...posters];

  switch (sortMode) {
    case 'numeric':
      return list.sort(comparePostersNumerically);

    case 'year-desc':
      return list.sort((a, b) => {
        if (b.year !== a.year) return b.year - a.year;
        // If same year, sort numerically by title / filename so folders are ordered!
        return comparePostersNumerically(a, b);
      });

    case 'rating-desc':
      return list.sort((a, b) => {
        if (b.rating !== a.rating) return b.rating - a.rating;
        return comparePostersNumerically(a, b);
      });

    case 'title-asc':
      return list.sort((a, b) => naturalCompare(a.title, b.title));

    case 'title-desc':
      return list.sort((a, b) => naturalCompare(b.title, a.title));

    default:
      return list;
  }
}
