/**
 * Recursively find a unique key by incrementing a suffix number
 * @param {string} base - The base key to check
 * @param {object} obj - The object to check
 * @param {number} count - The count to increment
 * @returns {string} The unique key
 */
export function getUniqueKey(base, obj, count = 1) {
  const candidate = count === 1 ? base : `${base}__${count}`;
  return obj[candidate] ? getUniqueKey(base, obj, count + 1) : candidate;
}
