/**
 * Convert database string ID to numeric ID (same hash function as boardings page)
 * This ensures consistency between the boardings page and owner dashboard
 */
export function stringIdToNumeric(id: string): number {
  let numericId = 0;
  if (id) {
    for (let i = 0; i < id.length; i++) {
      numericId = ((numericId << 5) - numericId) + id.charCodeAt(i);
      numericId = numericId & numericId; // Convert to 32-bit integer
    }
    numericId = Math.abs(numericId);
  }
  return numericId;
}




