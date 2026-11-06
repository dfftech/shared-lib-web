// Validation rules of the forms showcase (dff-util ConstKeys messages and RegExp patterns).
import { ConstKeys, RegExp } from "dff-util";

export const showcaseValidation = {
  name: { required: { value: true, message: ConstKeys.REQUIRED } },
  email: {
    required: { value: true, message: ConstKeys.REQUIRED },
    pattern: { value: RegExp.EMAIL, message: ConstKeys.INVALID_EMAIL },
  },
  role: { required: { value: true, message: ConstKeys.REQUIRED } },
  acceptTerms: { required: { value: true, message: ConstKeys.REQUIRED } },
  startDate: { required: { value: true, message: ConstKeys.REQUIRED } },
  code: {
    required: { value: true, message: ConstKeys.REQUIRED },
    pattern: { value: RegExp.DIGITS_ONLY, message: ConstKeys.FIELD_MUST_BE_NUMERIC },
    minLength: { value: 6, message: ConstKeys.MIN_LENGTH_REQUIRED },
  },
  skills: { required: { value: true, message: ConstKeys.REQUIRED } },
  title: { required: { value: true, message: ConstKeys.REQUIRED } },
  csvFile: { required: { value: true, message: ConstKeys.REQUIRED } },
};
