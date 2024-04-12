const Joi = require('joi');

const headerSchema = Joi.object({
    testing: Joi.string().valid('finance').required(),
    'user-agent': Joi.string().required(),
    accept: Joi.string(),
    'postman-token': Joi.string(),
    host: Joi.string(),
    'accept-encoding': Joi.string(),
    connection: Joi.string(),
    'content-type': Joi.string().valid('application/json'),
    'content-length': Joi.number(),
    authorization: Joi.string()
  });

module.exports = { headerSchema };