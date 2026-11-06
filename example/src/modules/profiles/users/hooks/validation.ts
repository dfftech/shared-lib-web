// User validation rules. Messages: dff-util ConstKeys. Patterns: dff-util RegExp.
import { ConstKeys, RegExp } from "dff-util";

export const userValidation = {
  name: {
    required: { value: true, message: ConstKeys.REQUIRED },
    maxLength: { value: 80, message: ConstKeys.MAX_LENGTH_EXCEED },
  },
  email: {
    required: { value: true, message: ConstKeys.REQUIRED },
    pattern: { value: RegExp.EMAIL, message: ConstKeys.INVALID_EMAIL },
  },
  phone: {
    required: { value: true, message: ConstKeys.REQUIRED },
    pattern: { value: RegExp.DIGITS_ONLY, message: ConstKeys.INVALID_PHONE },
    minLength: { value: 10, message: ConstKeys.MIN_LENGTH_REQUIRED },
    maxLength: { value: 15, message: ConstKeys.MAX_LENGTH_EXCEED },
  },
  role: { required: { value: true, message: ConstKeys.REQUIRED } },
  country: { required: { value: true, message: ConstKeys.REQUIRED } },
  notes: { maxLength: { value: 300, message: ConstKeys.MAX_LENGTH_EXCEED } },
};
