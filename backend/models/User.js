const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  fullName:   { type: String, required: true },
  role:       { type: String, enum: ['Student', 'Professor', 'Alumni'], default: 'Student' },
  email:      { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:   { type: String, required: true },
  avatar:     { type: String, default: '' },
  bio:        { type: String, default: '' },
  department: { type: String, default: '' },
  skills:     [{ type: String }],
  subjects:   [{ type: String }],
  batch:      { type: String, default: '' },
  company:    { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);