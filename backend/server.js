const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const JWT_SECRET = 'campusbridge_secret_2026';

// ─── Models ───
const User = require('./models/User');
const Post = require('./models/Post');
const Course = require('./models/Course');
const Notice = require('./models/Notice');
const LeaderboardEntry = require('./models/LeaderboardEntry');
const MentorSession = require('./models/MentorSession');
const Job = require('./models/Job');
const Message = require('./models/Message');
const DirectMessage = require('./models/DirectMessage');

// ─── Middleware ───
app.use(express.json({ limit: '10mb' }));
app.use(cors());

// Serve frontend & uploads statically
const frontendPath = path.join(__dirname, '../frontend');
const uploadsPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsPath)) fs.mkdirSync(uploadsPath, { recursive: true });
app.use(express.static(frontendPath));
app.use('/uploads', express.static(uploadsPath));

// ─── Gemini AI Proxy Moved ───
// ─── Multer ───
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsPath),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, Date.now() + '-' + Math.random().toString(36).substr(2, 9) + ext);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    cb(null, allowed.includes(path.extname(file.originalname).toLowerCase()));
  }
});

// ─── Auth Middleware ───
const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token' });
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) return res.status(401).json({ message: 'User not found' });
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// ─── MongoDB ───
const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campusbridge';
mongoose.connect(mongoURI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ DB Error:', err));

// ══════════════════════════════════════════════
//  AUTH
// ══════════════════════════════════════════════
app.post('/api/register', async (req, res) => {
  try {
    const { fullName, role, email, password } = req.body;
    if (!fullName || !email || !password) return res.status(400).json({ message: 'All fields are required.' });
    if (await User.findOne({ email })) return res.status(400).json({ message: 'Email already registered.' });
    const hashed = await bcrypt.hash(password, 10);
    const user = await new User({ fullName, role: role || 'Student', email, password: hashed }).save();
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ message: 'Registration successful!', token, user: { id: user._id, fullName: user.fullName, role: user.role, email: user.email, avatar: user.avatar } });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required.' });
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(400).json({ message: 'Invalid email or password.' });
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ message: 'Login successful!', token, user: { id: user._id, fullName: user.fullName, role: user.role, email: user.email, avatar: user.avatar } });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

// ══════════════════════════════════════════════
//  AI PROXY
// ══════════════════════════════════════════════
app.post('/api/ai/chat', auth, async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ message: 'Prompt is required.' });

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey === 'YOUR_GROQ_API_KEY_HERE') {
      return res.status(500).json({ message: 'Groq API key not configured in .env' });
    }

    const groqRes = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'groq/compound',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 500
        })
      }
    );

    if (!groqRes.ok) {
      const err = await groqRes.text();
      console.error('Groq API Error Detail:', err);
      return res.status(502).json({ message: 'Groq error: ' + groqRes.status, detail: err });
    }

    const data = await groqRes.json();
    const text = data.choices?.[0]?.message?.content || 'No response.';
    res.json({ text });
  } catch (err) {
    console.error('AI Proxy Error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// ══════════════════════════════════════════════
//  PROFILE / ME
// ══════════════════════════════════════════════
app.get('/api/me', auth, async (req, res) => {
  res.json(req.user);
});

app.patch('/api/me', auth, async (req, res) => {
  try {
    const allowed = ['bio', 'department', 'skills', 'subjects', 'batch', 'company', 'fullName'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/me/avatar', auth, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });
    const user = await User.findByIdAndUpdate(req.user._id, { avatar: req.file.filename }, { new: true }).select('-password');
    res.json({ avatar: user.avatar, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ══════════════════════════════════════════════
//  USERS (Directory + Search + Public Profile)
// ══════════════════════════════════════════════
app.get('/api/users', auth, async (req, res) => {
  try {
    const { search, role } = req.query;
    const query = {};
    if (search) query.$or = [
      { fullName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { department: { $regex: search, $options: 'i' } },
      { company: { $regex: search, $options: 'i' } },
    ];
    if (role) query.role = role;
    const users = await User.find(query).select('-password').sort({ createdAt: -1 }).limit(50);
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/users/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/users/:id/posts', auth, async (req, res) => {
  try {
    const posts = await Post.find({ author: req.params.id })
      .populate('author', 'fullName role avatar')
      .populate('comments.author', 'fullName avatar')
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ══════════════════════════════════════════════
//  SOCIAL FEED / POSTS
// ══════════════════════════════════════════════
app.get('/api/feed', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const posts = await Post.find()
      .populate('author', 'fullName role avatar')
      .populate('likes', 'fullName')
      .populate('comments.author', 'fullName avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit).limit(limit);
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/posts', auth, upload.single('image'), async (req, res) => {
  try {
    const { body } = req.body;
    if (!body && !req.file) return res.status(400).json({ message: 'Post must have text or image.' });
    const post = await new Post({
      body: body || '',
      image: req.file ? req.file.filename : '',
      author: req.user._id,
    }).save();
    const populated = await Post.findById(post._id)
      .populate('author', 'fullName role avatar')
      .populate('comments.author', 'fullName avatar');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/posts/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found.' });
    if (post.author.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorised.' });
    await post.deleteOne();
    res.json({ message: 'Post deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/posts/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found.' });
    const idx = post.likes.findIndex(id => id.toString() === req.user._id.toString());
    if (idx === -1) post.likes.push(req.user._id);
    else post.likes.splice(idx, 1);
    await post.save();
    res.json({ likes: post.likes.length, liked: idx === -1 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/posts/:id/comment', auth, async (req, res) => {
  try {
    const { text, parentId } = req.body;
    if (!text) return res.status(400).json({ message: 'Comment text required.' });
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found.' });
    post.comments.push({ author: req.user._id, text, parentId: parentId || null });
    await post.save();
    const updated = await Post.findById(post._id)
      .populate('author', 'fullName role avatar')
      .populate('comments.author', 'fullName avatar');
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/posts/:id/comment/:cid/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found.' });
    const comment = post.comments.id(req.params.cid);
    if (!comment) return res.status(404).json({ message: 'Comment not found.' });
    
    if (!comment.likes) comment.likes = [];
    const uid = req.user._id.toString();
    const idx = comment.likes.findIndex(id => id.toString() === uid);
    
    let isLiked = false;
    if (idx === -1) {
      comment.likes.push(uid);
      isLiked = true;
    } else {
      comment.likes.splice(idx, 1);
      isLiked = false;
    }
    
    await post.save();
    res.json({ likes: comment.likes.length, liked: isLiked });
  } catch (err) {
    console.error('Like Comment Error:', err);
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/posts/:id/comment/:cid', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found.' });
    const comment = post.comments.id(req.params.cid);
    if (!comment) return res.status(404).json({ message: 'Comment not found.' });
    if (comment.author.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorised.' });
    comment.deleteOne();
    await post.save();
    res.json({ message: 'Comment deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ══════════════════════════════════════════════
//  DIRECT MESSAGES
// ══════════════════════════════════════════════
app.get('/api/dm/conversations', auth, async (req, res) => {
  try {
    const myId = req.user._id;
    const msgs = await DirectMessage.find({
      $or: [{ sender: myId }, { recipient: myId }]
    }).sort({ createdAt: -1 });

    const convMap = {};
    for (const m of msgs) {
      const otherId = m.sender.toString() === myId.toString() ? m.recipient.toString() : m.sender.toString();
      if (!convMap[otherId]) convMap[otherId] = { lastMessage: m, unread: 0 };
      if (!m.read && m.recipient.toString() === myId.toString()) convMap[otherId].unread++;
    }

    const userIds = Object.keys(convMap);
    const users = await User.find({ _id: { $in: userIds } }).select('-password');
    const conversations = users.map(u => ({
      user: u,
      lastMessage: convMap[u._id.toString()].lastMessage,
      unread: convMap[u._id.toString()].unread,
    })).sort((a, b) => new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt));

    res.json(conversations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/dm/unread-count', auth, async (req, res) => {
  try {
    const count = await DirectMessage.countDocuments({ recipient: req.user._id, read: false });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/dm/:userId', auth, async (req, res) => {
  try {
    const myId = req.user._id;
    const otherId = req.params.userId;
    const messages = await DirectMessage.find({
      $or: [
        { sender: myId, recipient: otherId },
        { sender: otherId, recipient: myId },
      ]
    }).populate('sender', 'fullName avatar').sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/dm/:userId', auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'Message text required.' });
    const msg = await new DirectMessage({
      sender: req.user._id,
      recipient: req.params.userId,
      text,
    }).save();
    const populated = await DirectMessage.findById(msg._id).populate('sender', 'fullName avatar');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.patch('/api/dm/:userId/read', auth, async (req, res) => {
  try {
    await DirectMessage.updateMany(
      { sender: req.params.userId, recipient: req.user._id, read: false },
      { read: true }
    );
    res.json({ message: 'Marked as read.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.patch('/api/dm/message/:messageId', auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'Text required.' });
    
    const msg = await DirectMessage.findById(req.params.messageId);
    if (!msg) return res.status(404).json({ message: 'Message not found.' });
    
    if (msg.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this message.' });
    }
    
    const diffMins = (Date.now() - new Date(msg.createdAt).getTime()) / 60000;
    if (diffMins > 15) {
      return res.status(403).json({ message: 'Cannot edit message after 15 minutes.' });
    }
    
    msg.text = text;
    msg.isEdited = true;
    await msg.save();
    
    res.json({ message: 'Message updated.', msg });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/dm/message/:messageId', auth, async (req, res) => {
  try {
    const msg = await DirectMessage.findById(req.params.messageId);
    if (!msg) return res.status(404).json({ message: 'Message not found.' });
    
    if (msg.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this message.' });
    }
    
    const diffHours = (Date.now() - new Date(msg.createdAt).getTime()) / 3600000;
    if (diffHours > 1) {
      return res.status(403).json({ message: 'Cannot delete message after 1 hour.' });
    }
    
    msg.text = 'This message was deleted';
    msg.isDeleted = true;
    await msg.save();
    
    res.json({ message: 'Message deleted.', msg });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ══════════════════════════════════════════════
//  COURSES
// ══════════════════════════════════════════════
app.get('/api/courses', auth, async (req, res) => {
  try {
    const courses = await Course.find()
      .populate('professor', 'fullName avatar')
      .sort({ createdAt: -1 });
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/courses', auth, async (req, res) => {
  try {
    if (req.user.role !== 'Professor') return res.status(403).json({ message: 'Only professors can create courses.' });
    const { title, subject, description } = req.body;
    if (!title || !subject) return res.status(400).json({ message: 'Title and subject required.' });
    const course = await new Course({ title, subject, description, professor: req.user._id }).save();
    const populated = await Course.findById(course._id).populate('professor', 'fullName avatar');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/courses/:id', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('professor', 'fullName avatar role')
      .populate('enrolledStudents', 'fullName avatar role');
    if (!course) return res.status(404).json({ message: 'Course not found.' });
    res.json(course);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/courses/:id', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found.' });
    if (course.professor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this course.' });
    }
    await Course.findByIdAndDelete(req.params.id);
    res.json({ message: 'Course deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/courses/:id/enroll', auth, async (req, res) => {
  try {
    if (req.user.role !== 'Student') return res.status(403).json({ message: 'Only students can enroll.' });
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found.' });
    if (course.enrolledStudents.includes(req.user._id))
      return res.status(400).json({ message: 'Already enrolled.' });
    course.enrolledStudents.push(req.user._id);
    await course.save();
    res.json({ message: 'Enrolled successfully!' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/courses/:id/enroll', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found.' });
    course.enrolledStudents = course.enrolledStudents.filter(s => s.toString() !== req.user._id.toString());
    await course.save();
    res.json({ message: 'Unenrolled.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/courses/:id/resource', auth, async (req, res) => {
  try {
    if (req.user.role !== 'Professor') return res.status(403).json({ message: 'Professors only.' });
    const { title, url, type } = req.body;
    if (!title || !url) return res.status(400).json({ message: 'Title and URL required.' });
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found.' });
    course.resources.push({ title, url, type: type || 'link' });
    await course.save();
    res.json(course);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/courses/:id/assignment', auth, async (req, res) => {
  try {
    if (req.user.role !== 'Professor') return res.status(403).json({ message: 'Professors only.' });
    const { title, description, dueDate } = req.body;
    if (!title) return res.status(400).json({ message: 'Title required.' });
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found.' });
    course.assignments.push({ title, description, dueDate });
    await course.save();
    res.json(course);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ══════════════════════════════════════════════
//  NOTICES
// ══════════════════════════════════════════════
app.get('/api/notices', auth, async (req, res) => {
  try {
    const notices = await Notice.find()
      .populate('author', 'fullName role avatar')
      .sort({ createdAt: -1 });
    res.json(notices);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/notices', auth, async (req, res) => {
  try {
    if (!['Professor', 'Alumni'].includes(req.user.role))
      return res.status(403).json({ message: 'Professors and alumni only.' });
    const { title, body, priority, tags } = req.body;
    if (!title || !body) return res.status(400).json({ message: 'Title and body required.' });
    const notice = await new Notice({
      title, body,
      priority: priority || 'medium',
      tags: tags || [],
      author: req.user._id,
    }).save();
    const populated = await Notice.findById(notice._id).populate('author', 'fullName role avatar');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/notices/:id', auth, async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) return res.status(404).json({ message: 'Not found.' });
    if (notice.author.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorised.' });
    await notice.deleteOne();
    res.json({ message: 'Deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ══════════════════════════════════════════════
//  LEADERBOARD
// ══════════════════════════════════════════════
app.get('/api/leaderboard', auth, async (req, res) => {
  try {
    const { subject } = req.query;
    const query = subject ? { subject } : {};
    const entries = await LeaderboardEntry.find(query)
      .populate('user', 'fullName role avatar department')
      .sort({ score: -1 });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/leaderboard/score', auth, async (req, res) => {
  try {
    if (req.user.role !== 'Professor') return res.status(403).json({ message: 'Professors only.' });
    const { userId, subject, score } = req.body;
    if (!userId || !subject || score === undefined)
      return res.status(400).json({ message: 'userId, subject, and score required.' });

    const badges = [];
    if (score === 100) badges.push('⚡ Perfect Score');
    if (score >= 90)  badges.push('🥇 Distinction');
    if (score >= 75)  badges.push('🏅 Merit');

    const entry = await LeaderboardEntry.findOneAndUpdate(
      { user: userId, subject },
      { score, badges },
      { upsert: true, new: true }
    ).populate('user', 'fullName role avatar');

    res.json(entry);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/leaderboard/subjects', auth, async (req, res) => {
  try {
    const subjects = await LeaderboardEntry.distinct('subject');
    res.json(subjects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ══════════════════════════════════════════════
//  MENTORSHIP
// ══════════════════════════════════════════════
app.get('/api/mentors', auth, async (req, res) => {
  try {
    const mentors = await User.find({ role: 'Alumni' }).select('-password').sort({ createdAt: -1 });
    res.json(mentors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/mentorship/request', auth, async (req, res) => {
  try {
    if (req.user.role !== 'Student') return res.status(403).json({ message: 'Only students can request mentorship.' });
    const { mentorId, topic, scheduledAt } = req.body;
    if (!mentorId || !topic) return res.status(400).json({ message: 'Mentor and topic required.' });
    const session = await new MentorSession({
      mentor: mentorId, mentee: req.user._id, topic, scheduledAt: scheduledAt || '',
    }).save();
    const populated = await MentorSession.findById(session._id)
      .populate('mentor', 'fullName avatar company')
      .populate('mentee', 'fullName avatar department');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/mentorship/sessions', auth, async (req, res) => {
  try {
    const query = req.user.role === 'Alumni'
      ? { mentor: req.user._id }
      : { mentee: req.user._id };
    const sessions = await MentorSession.find(query)
      .populate('mentor', 'fullName avatar company role')
      .populate('mentee', 'fullName avatar department role')
      .sort({ createdAt: -1 });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.patch('/api/mentorship/sessions/:id', auth, async (req, res) => {
  try {
    const session = await MentorSession.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found.' });
    const { status, notes } = req.body;
    if (status) session.status = status;
    if (notes !== undefined) session.notes = notes;
    await session.save();
    const populated = await MentorSession.findById(session._id)
      .populate('mentor', 'fullName avatar company role')
      .populate('mentee', 'fullName avatar department role');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ══════════════════════════════════════════════
//  JOBS / ALUMNI
// ══════════════════════════════════════════════
app.get('/api/alumni', auth, async (req, res) => {
  try {
    const alumni = await User.find({ role: 'Alumni' }).select('-password').sort({ createdAt: -1 });
    res.json(alumni);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/jobs', auth, async (req, res) => {
  try {
    const jobs = await Job.find().populate('postedBy', 'fullName avatar company').sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/jobs', auth, async (req, res) => {
  try {
    if (req.user.role !== 'Alumni') return res.status(403).json({ message: 'Only alumni can post jobs.' });
    const { title, company, description, type, location, applyLink, tags } = req.body;
    if (!title || !company) return res.status(400).json({ message: 'Title and company required.' });
    const job = await new Job({
      title, company, description, type, location, applyLink,
      tags: tags || [], postedBy: req.user._id,
    }).save();
    const populated = await Job.findById(job._id).populate('postedBy', 'fullName avatar company');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/jobs/:id', auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Not found.' });
    if (job.postedBy.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorised.' });
    await job.deleteOne();
    res.json({ message: 'Job deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ══════════════════════════════════════════════
//  ANALYTICS (Professor)
// ══════════════════════════════════════════════
app.get('/api/analytics', auth, async (req, res) => {
  try {
    if (req.user.role !== 'Professor') return res.status(403).json({ message: 'Professors only.' });
    const courses = await Course.find({ professor: req.user._id })
      .populate('enrolledStudents', 'fullName');
    const notices = await Notice.find({ author: req.user._id });
    const allEntries = await LeaderboardEntry.find({});

    let totalStudents = 0;
    const courseStats = courses.map(c => {
      totalStudents += c.enrolledStudents.length;
      const subjectEntries = allEntries.filter(e => e.subject === c.subject);
      const avg = subjectEntries.length
        ? Math.round(subjectEntries.reduce((s, e) => s + e.score, 0) / subjectEntries.length)
        : 0;
      const atRisk = subjectEntries.filter(e => e.score < 40).length;
      return { course: c, enrolled: c.enrolledStudents.length, avgScore: avg, atRisk };
    });

    const totalAvg = courseStats.length
      ? Math.round(courseStats.reduce((s, c) => s + c.avgScore, 0) / courseStats.length)
      : 0;

    res.json({
      totalStudents,
      totalCourses: courses.length,
      totalNotices: notices.length,
      avgScore: totalAvg,
      courseStats,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ══════════════════════════════════════════════
//  GROUP CHAT
// ══════════════════════════════════════════════
app.get('/api/messages/:room', auth, async (req, res) => {
  try {
    const messages = await Message.find({ room: req.params.room })
      .populate('sender', 'fullName avatar role')
      .sort({ createdAt: 1 })
      .limit(100);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/messages/:room', auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'Text required.' });
    const msg = await new Message({ sender: req.user._id, room: req.params.room, text }).save();
    const populated = await Message.findById(msg._id).populate('sender', 'fullName avatar role');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── Start ───
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`🚀 CampusBridge running on http://localhost:${PORT}`));
}

module.exports = app;