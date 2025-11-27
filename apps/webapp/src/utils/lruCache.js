/**
 * Simple LRU (Least Recently Used) Cache implementation
 * Used for message deduplication to prevent unbounded memory growth
 */
class LRUCache {
  constructor(maxSize = 1000) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  /**
   * Get a value from the cache
   * @param {string} key - The cache key
   * @returns {*} The cached value or undefined
   */
  get(key) {
    if (!this.cache.has(key)) {
      return undefined;
    }

    // Move to end (most recently used)
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  /**
   * Set a value in the cache
   * @param {string} key - The cache key
   * @param {*} value - The value to cache
   */
  set(key, value) {
    // Delete if exists (to reinsert at end)
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Add to end
    this.cache.set(key, value);

    // Remove oldest if over limit
    if (this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  /**
   * Check if a key exists in the cache
   * @param {string} key - The cache key
   * @returns {boolean} True if key exists
   */
  has(key) {
    return this.cache.has(key);
  }

  /**
   * Remove a key from the cache
   * @param {string} key - The cache key
   */
  delete(key) {
    this.cache.delete(key);
  }

  /**
   * Clear all entries from the cache
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Get the current size of the cache
   * @returns {number} Number of entries in cache
   */
  size() {
    return this.cache.size;
  }

  /**
   * Remove entries older than a specified time
   * @param {number} maxAgeMs - Maximum age in milliseconds
   */
  removeOlderThan(maxAgeMs) {
    const now = Date.now();
    const keysToDelete = [];

    for (const [key, value] of this.cache.entries()) {
      if (typeof value === 'object' && value.timestamp) {
        if (now - value.timestamp > maxAgeMs) {
          keysToDelete.push(key);
        }
      }
    }

    keysToDelete.forEach((key) => this.cache.delete(key));
    return keysToDelete.length;
  }
}

export default LRUCache;
