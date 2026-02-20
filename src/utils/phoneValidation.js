// Indian Mobile Number Validation (TRAI standard)
// Valid: exactly 10 digits, starts with 6, 7, 8, or 9

export const INDIAN_PHONE_REGEX = /^[6-9]\d{9}$/;

/**
 * Returns true if `phone` is a valid Indian mobile number.
 * @param {string} phone
 */
export const isValidIndianPhone = (phone) => INDIAN_PHONE_REGEX.test(phone);

/**
 * Strips all non-digit characters and caps length at 10.
 * Use in onChange handlers.
 * @param {string} val
 */
export const sanitizePhone = (val) => val.replace(/\D/g, "").slice(0, 10);
