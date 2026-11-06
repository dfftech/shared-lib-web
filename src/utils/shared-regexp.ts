// shared-regexp.ts
// dff-util RegExp plus a few patterns it does not have. Use dff-util RegExp first.
//
//   pattern: { value: SharedRegExp.MOBILE_10, message: ConstKeys.INVALID_PHONE }

import { RegExp as DffRegExp } from "dff-util";

export const SharedRegExp = {
  ...DffRegExp,
  /** Exactly 10 digits (mobile number without country code). */
  MOBILE_10: /^[0-9]{10}$/,
  /** Letters and spaces only (person names). */
  PERSON_NAME: /^[\p{L}\s]+$/u,
  /** Letters, numbers, spaces and , ' . / - (city, state, address lines). */
  ADDRESS_TEXT: /^[\p{L}0-9\s,'./-]+$/u,
  /** Upper-case letters and digits (codes and ids). */
  UPPER_ALPHA_NUMERIC: /^[A-Z0-9]+$/,
};
