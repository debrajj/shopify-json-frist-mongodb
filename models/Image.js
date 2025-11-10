const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  contentType: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  gridfsId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  shop: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('Image', imageSchema);
