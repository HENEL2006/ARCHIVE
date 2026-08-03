import Joi from "joi";

export const productValidationSchema = Joi.object({
  name: Joi.string().trim().min(3).max(100).required().messages({
    "string.empty": "PRODUCT NAME IS REQUIRED",
    "string.min": "PRODUCT NAME MUST HAVE AT LEAST 3 CHARACTERS",
    "string.max": "PRODUCT NAME MUST NOT EXCEED 100 CHARACTERS",
  }),

  slug: Joi.string()
    .trim()
    .lowercase()
    .pattern(/^[a-z0-9-]+$/)
    .required()
    .messages({
      "string.empty": "PRODUCT SLUG IS REQUIRED",
      "string.pattern.base":
        "SLUG CAN ONLY CONTAIN LOWERCASE LETTERS, NUMBERS AND HYPHENS",
    }),

  category: Joi.string().trim().required().messages({
    "string.empty": "CATEGORY IS REQUIRED",
  }),

  brand: Joi.string().trim().min(2).max(50).required().messages({
    "string.empty": "BRAND IS REQUIRED",
    "string.min": "BRAND NAME IS TOO SHORT",
    "string.max": "BRAND NAME IS TOO LONG",
  }),

  status: Joi.string().valid("Listed", "Unlisted").required().messages({
    "any.only": "INVALID STATUS",
    "string.empty": "STATUS IS REQUIRED",
  }),

  price: Joi.number().positive().precision(2).required().messages({
    "number.base": "PRICE MUST BE A NUMBER",
    "number.positive": "PRICE MUST BE GREATER THAN 0",
    "any.required": "PRICE IS REQUIRED",
  }),

  shortDescription: Joi.string().trim().min(10).max(200).required().messages({
    "string.empty": "SHORT DESCRIPTION IS REQUIRED",
    "string.min": "SHORT DESCRIPTION MUST HAVE AT LEAST 10 CHARACTERS",
    "string.max": "SHORT DESCRIPTION MUST NOT EXCEED 200 CHARACTERS",
  }),

  description: Joi.string().trim().min(20).max(2000).required().messages({
    "string.empty": "DESCRIPTION IS REQUIRED",
    "string.min": "DESCRIPTION MUST HAVE AT LEAST 20 CHARACTERS",
    "string.max": "DESCRIPTION MUST NOT EXCEED 2000 CHARACTERS",
  }),

  sizes: Joi.array()
    .items(Joi.string().valid("S", "M", "L", "XL", "XXL").required())
    .min(1)
    .required()
    .messages({
      "array.base": "INVALID SIZE VARIANTS",
      "array.min": "ADD AT LEAST ONE SIZE VARIANT",
      "any.required": "SIZE VARIANTS ARE REQUIRED",
    }),

  stocks: Joi.array()
    .items(
      Joi.number().integer().min(1).required().messages({
        "number.base": "QUANTITY MUST BE A NUMBER",
        "number.min": "QUANTITY MUST BE GREATER THAN 0",
        "any.required": "QUANTITY IS REQUIRED",
      }),
    )
    .min(1)
    .required()
    .messages({
      "array.base": "INVALID STOCK VALUES",
      "array.min": "ADD STOCK FOR EACH SIZE",
      "any.required": "STOCK VALUES ARE REQUIRED",
    }),
});
