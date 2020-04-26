//Validation
const Joi = require("@hapi/joi").extend(require("@hapi/joi-date"));

//Month Validation
const monthValidation = data => {
  const schema = Joi.date().format("YYYY-MM");

  return schema.validate(data);
};

//Date Validation
const dateValidation = data => {
  const schema = Joi.date().format("YYYY-MM-DD");
  return schema.validate(data);
};

module.exports.monthValidation = monthValidation;
module.exports.dateValidation = dateValidation;
