const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  company:     { type: String, required: true },
  postedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  description: { type: String, default: '' },
  type:        { type: String, enum: ['Full-time', 'Part-time', 'Internship', 'Contract'], default: 'Full-time' },
  location:    { type: String, default: 'Remote' },
  applyLink:   { type: String, default: '' },
  tags:        [{ type: String }],
}, { timestamps: true });

module.exports = mongoose.model('Job', JobSchema);
