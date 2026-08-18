const mongoose = require('mongoose');

const MentorSessionSchema = new mongoose.Schema({
  mentor:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mentee:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  topic:       { type: String, required: true },
  scheduledAt: { type: String, default: '' },
  status:      { type: String, enum: ['pending', 'accepted', 'declined', 'completed'], default: 'pending' },
  notes:       { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('MentorSession', MentorSessionSchema);
