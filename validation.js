//Validation
const Joi = require('@hapi/joi')
    .extend(require('@hapi/joi-date'));

//Register Validation
const registerValidation = data => {
  const schema = Joi.object({
    name: Joi.string()
      .min(3)
      .required(),
    email: Joi.string()
      .min(6)
      .required()
      .email(),
    password: Joi.string()
      .min(6)
      .required()
  });
  return schema.validate(data);
};

//Login Validation
const loginValidation = data => {
  const schema = Joi.object({
    email: Joi.string()
      .min(6)
      .required()
      .email(),
    password: Joi.string()
      .min(6)
      .required()
  });
  return schema.validate(data);
};

//Direct InfluxDB Query
const directQueryValidation = data => {
  const schema = Joi.object({
    query: Joi.string().required()
  });
  return schema.validate(data);
};

//Month Validation
const monthValidation = data => {
  const schema = Joi.object({
    query: Joi.date().format('YYYY-MM')
  });
  return schema.validate(data);
};

//Date Validation
const dateValidation = data => {
  const schema = Joi.object({
    query: Joi.date().format('YYYY-MM-DD')
  });
  return schema.validate(data);
};

module.exports.registerValidation = registerValidation;
module.exports.loginValidation = loginValidation;
module.exports.directQueryValidation = directQueryValidation;
module.exports.monthValidation = monthValidation;
module.exports.dateValidation = dateValidation;