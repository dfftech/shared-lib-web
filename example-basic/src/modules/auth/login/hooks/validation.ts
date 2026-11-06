// Login validation rules. Messages are dff-util ConstKeys, patterns are dff-util RegExp.
import { ConstKeys, RegExp } from "dff-util";

export const loginValidation = {
  email: {
    required: { value: true, message: ConstKeys.REQUIRED },
    pattern: { value: RegExp.EMAIL, message: ConstKeys.INVALID_EMAIL },
  },
  password: {
    required: { value: true, message: ConstKeys.REQUIRED },
    minLength: { value: 6, message: ConstKeys.MIN_LENGTH_REQUIRED },
  },
};
