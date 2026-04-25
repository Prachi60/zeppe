/**
 * Normalize email address by trimming and converting to lowercase
 * @param {string} email
 * @returns {string}
 */
export function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

/**
 * Check if a string is a valid email
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(normalizeEmail(email));
}

/**
 * Mask email for privacy (e.g., a***b@example.com)
 * @param {string} email
 * @returns {string}
 */
export function maskEmail(email) {
  if (!email || !email.includes("@")) return email;
  const [user, domain] = email.split("@");
  if (user.length <= 2) return `${user[0]}***@${domain}`;
  return `${user[0]}${"*".repeat(user.length - 2)}${user.slice(-1)}@${domain}`;
}
