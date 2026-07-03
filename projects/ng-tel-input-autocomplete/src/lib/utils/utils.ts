/**
 * Escapes HTML special characters to prevent XSS when injecting text into innerHTML.
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Converts an ISO 3166-1 alpha-2 country code to a flag emoji.
 * Returns a globe emoji for invalid codes.
 */
export function getFlagEmoji(countryCode: string): string {
  if (!/^[a-z]{2}$/i.test(countryCode)) return '🌐';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  try {
    return String.fromCodePoint(...codePoints);
  } catch {
    return '🌐';
  }
}
