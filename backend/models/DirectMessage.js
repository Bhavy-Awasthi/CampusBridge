const mongoose = require('mongoose');

const DirectMessageSchema = new mongoose.Schema({
  sender:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text:      { type: String, required: true },
  read:      { type: Boolean, default: false },
  isEdited:  { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('DirectMessage', DirectMessageSchema);
