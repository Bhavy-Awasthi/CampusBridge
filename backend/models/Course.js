const mongoose = require('mongoose');

const ResourceSchema = new mongoose.Schema({
  title: String,
  url:   String,
  type:  { type: String, default: 'link' },
}, { timestamps: true });

const AssignmentSchema = new mongoose.Schema({
  title:       String,
  description: String,
  dueDate:     Date,
}, { timestamps: true });

const CourseSchema = new mongoose.Schema({
  title:            { type: String, required: true },
  subject:          { type: String, required: true },
  description:      { type: String, default: '' },
  professor:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  enrolledStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  resources:        [ResourceSchema],
  assignments:      [AssignmentSchema],
}, { timestamps: true });

module.exports = mongoose.model('Course', CourseSchema);
