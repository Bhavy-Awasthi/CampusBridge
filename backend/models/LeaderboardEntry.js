const mongoose = require('mongoose');

const LeaderboardEntrySchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: String, required: true },
  score:   { type: Number, default: 0 },
  badges:  [{ type: String }],
}, { timestamps: true });

LeaderboardEntrySchema.index({ user: 1, subject: 1 }, { unique: true });

module.exports = mongoose.model('LeaderboardEntry', LeaderboardEntrySchema);
