const mongoose = require('mongoose');

const NoticeSchema = new mongoose.Schema({
  title:    { type: String, required: true },
  body:     { type: String, required: true },
  author:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course:   { type: mongoose.Schema.Types.ObjectId, ref: 'Course', default: null },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  tags:     [{ type: String }],
}, { timestamps: true });

module.exports = mongoose.model('Notice', NoticeSchema);
