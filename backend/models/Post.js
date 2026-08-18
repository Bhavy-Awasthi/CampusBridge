const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  author:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text:     { type: String, required: true },
  likes:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  parentId: { type: mongoose.Schema.Types.ObjectId, default: null }
}, { timestamps: true });

const PostSchema = new mongoose.Schema({
  body:     { type: String, default: '' },
  image:    { type: String, default: '' },
  author:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  likes:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [CommentSchema],
}, { timestamps: true });

module.exports = mongoose.model('Post', PostSchema);
