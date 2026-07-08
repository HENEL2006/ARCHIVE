import { addressValidationSchema } from "../validators/addressValidator.js";

export const validateAddress = (req, res, next) => {
  const { error } = addressValidationSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    console.log(error)
    const errors = {};

    error.details.forEach((err) => {
      errors[err.path[0]] = err.message;
    });

    return res.render("user/addAddress", {
      errors,
      oldData: req.body,
    });
  }

  next();
};