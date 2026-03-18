/**
 * Security utilities for input sanitization and XSS prevention
 * 
 * Requirements 12.5: Sanitize all user inputs to prevent XSS attacks
 */

/**
 * Sanitizes user input by escaping characters that could be used for XSS attacks
 * 
 * This function escapes the following characters:
 * - < (less than) -> &lt;
 * - > (greater than) -> &gt;
 * - & (ampersand) -> &amp;
 * - " (double quote) -> &quot;
 * - ' (single quote) -> &#x27;
 * - / (forward slash) -> &#x2F;
 * 
 * Requirements 12.5: Validates that all user inputs are sanitized to prevent XSS attacks
 * 
 * @param input - The user input string to sanitize
 * @returns The sanitized string with XSS characters escaped
 */
export function sanitizeInput(input: string): string {
  // Handle non-string inputs
  if (typeof input !== 'string') {
    return ''
  }

  // Escape XSS-prone characters
  return input
    .replace(/&/g, '&amp;')   // Must be first to avoid double-escaping
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}
