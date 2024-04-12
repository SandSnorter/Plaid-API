const mongoose = require('mongoose');

const itemSchema = mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  availableProducts: Array,
  billedProducts: Array,
  institutionId: String,
  itemId: String,
  webhook: String
});

module.exports = mongoose.model('PlaidItem', itemSchema);