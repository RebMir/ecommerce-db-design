const Joi = require('joi');
const mongoose = require('mongoose');

// Validate MongoDB ObjectId
const validateProductId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid product ID format'
    });
  }
  next();
};

// Validate order creation
const validateOrder = (req, res, next) => {
  const schema = Joi.object({
    customer: Joi.object({
      name: Joi.string().required().trim().max(100),
      email: Joi.string().email().required().trim(),
      phone: Joi.string().required().trim().pattern(/^[0-9+\-\s\(\)]+$/)
    }).required(),
    items: Joi.array().min(1).items(
      Joi.object({
        productId: Joi.string().required().custom((value, helpers) => {
          if (!mongoose.Types.ObjectId.isValid(value)) {
            return helpers.error('any.invalid');
          }
          return value;
        }),
        quantity: Joi.number().integer().min(1).max(50).required(),
        variant: Joi.object({
          size: Joi.string().trim(),
          color: Joi.string().trim()
        }).optional()
      })
    ).required(),
    paymentMethod: Joi.string().valid('mpesa', 'bank-transfer', 'cash-on-delivery').required(),
    shippingAddress: Joi.object({
      street: Joi.string().required().trim(),
      city: Joi.string().required().trim(),
      state: Joi.string().trim(),
      zipCode: Joi.string().trim(),
      country: Joi.string().required().trim()
    }).required(),
    notes: Joi.string().max(500).optional()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.details.map(detail => detail.message)
    });
  }
  next();
};

// Validate M-Pesa payment
const validateMpesaPayment = (req, res, next) => {
  const schema = Joi.object({
    phoneNumber: Joi.string().required().pattern(/^254[0-9]{9}$/).message('Phone number must be in format 254XXXXXXXXX'),
    amount: Joi.number().positive().required(),
    orderId: Joi.string().required().custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.error('any.invalid');
      }
      return value;
    })
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.details.map(detail => detail.message)
    });
  }
  next();
};

// Validate bank transfer
const validateBankTransfer = (req, res, next) => {
  const schema = Joi.object({
    orderId: Joi.string().required().custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.error('any.invalid');
      }
      return value;
    }),
    referenceNumber: Joi.string().required().trim().min(5).max(50),
    bankName: Joi.string().required().trim().max(100)
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.details.map(detail => detail.message)
    });
  }
  next();
};

module.exports = {
  validateProductId,
  validateOrder,
  validateMpesaPayment,
  validateBankTransfer
};