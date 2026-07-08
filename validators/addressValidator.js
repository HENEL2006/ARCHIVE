import Joi from "joi";

export const addressValidationSchema = Joi.object({
  fullName: Joi.string()
    .trim()
    .min(3)
    .max(50)
    .pattern(/^[A-Za-z\s'-]+$/)
    .required()
    .messages({
      "string.empty": "FULL NAME REQUIRED",
      "string.min": "FULL NAME MUST HAVE AT LEAST 3 CHARACTER",
      "string.max": "FULL NAME MUST NOT EXCEED 50 CHARACTERS",
      "string.pattern.base": "FULLNAME CONTAINS INVALID CHARACTERS",
    }),
  phone: Joi.string()
    .trim()
    .pattern(/^[6-9]\d{9}$/)
    .required()
    .messages({
      "string.empty": "PHONE NUMBER IS REQUIRED",
      "string.pattern.base": "INVALID PHONE NUMBER",
    }),
  addressLine1: Joi.string().trim().min(5).max(50).required().messages({
    "string.empty": "ADDRESS LINE 1 IS REQUIRED",
    "string.min": "ADDRESS LINE 1 MUST HAVE AT LEAST 5 CHARACTERS",
    "string.max": "ADDRESS LINE 1 MUST NOT EXCEED 50 CHARACTERS",
  }),
  addressLine2: Joi.string().trim().max(50).allow("", null).messages({
    "string.max": "ADDRESS LINE 2 MUST NOT EXCEED 50 CHARACTERS",
  }),

  city: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .pattern(/^[A-Za-z\s'-]+$/)
    .required()
    .messages({
      "string.empty": "CITY IS REQUIRED",
      "string.min": "CITY MUST HAVE AT LEAST 2 CHARACTERS",
      "string.max": "CITY MUST NOT EXCEED 50 CHARACTERS",
      "string.pattern.base": "CITY NAME IS INVALID",
    }),

  state: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .pattern(/^[A-Za-z\s'-]+$/)
    .required()
    .messages({
      "string.empty": "STATE IS REQUIRED",
      "string.min": "STATE MUST HAVE AT LEAST 2 CHARACTERS",
      "string.max": "STATE MUST NOT EXCEED 50 CHARACTERS",
      "string.pattern.base": "STATE NAME IS INVALID",
    }),

  postalCode: Joi.string()
    .trim()
    .pattern(/^[1-9][0-9]{5}$/)
    .required()
    .messages({
      "string.empty": "POSTAL CODE IS REQUIRED",
      "string.pattern.base": "INVALID PINCODE",
    }),

  country: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .pattern(/^[A-Za-z\s'-]+$/)
    .required()
    .messages({
      "string.empty": "COUNTRY IS REQUIRED",
      "string.min": "COUNTRY MUST HAVE AT LEAST 2 CHARACTERS",
      "string.max": "COUNTRY MUST NOT EXCEED 50 CHARACTERS",
      "string.pattern.base": "COUNTRY NAME IS INVALID",
    }),
    
  isDefault: Joi.boolean().truthy("on").falsy("").default(false),
});
