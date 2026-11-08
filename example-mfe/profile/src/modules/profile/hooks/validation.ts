// Profile validation rules. Messages are dff-util ConstKeys, patterns are dff-util RegExp.
import { ConstKeys, RegExp } from "dff-util";

export const profileValidation = {
  name: { required: { value: true, message: ConstKeys.REQUIRED } },
  email: {
    required: { value: true, message: ConstKeys.REQUIRED },
    pattern: { value: RegExp.EMAIL, message: ConstKeys.INVALID_EMAIL },
  },
  role: { required: { value: true, message: ConstKeys.REQUIRED } },
};
