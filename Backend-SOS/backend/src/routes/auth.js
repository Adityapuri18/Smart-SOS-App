const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config');
const crypto = require('crypto');
const notification = require('../services/notification');
const userStore = require('../services/userStore');

// Register and login using phone/email + password (no OTP)
router.post('/register', async (req, res) => {
  const { phone, email, name, password } = req.body;
  if (!phone && !email) return res.status(400).json({ error: 'phone or email required' });
  if (!password) return res.status(400).json({ error: 'password required' });

  const exists = await userStore.findOne({ $or: [{ phone }, { email }] });
  if (exists) return res.status(409).json({ error: 'User already exists with provided phone/email' });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await userStore.createUser({ phone, email, name, passwordHash });
  const token = jwt.sign({ sub: user._id }, config.jwtSecret, { expiresIn: '30d' });
  const userObj = userStore.toPlainUser(user);
  delete userObj.passwordHash;
  res.json({ token, user: userObj });
});

router.post('/login', async (req, res) => {
  console.log(`[Auth] Login attempt received for: ${req.body.phone || req.body.email}`);
  const { phone, email, password } = req.body;
  if ((!phone && !email) || !password) return res.status(400).json({ error: 'phone/email and password required' });

  const user = await userStore.findOne({ $or: [{ phone }, { email }] });
  if (!user || !user.passwordHash) return res.status(401).json({ error: 'Invalid credentials' });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ sub: user._id }, config.jwtSecret, { expiresIn: '30d' });
  const userObj = userStore.toPlainUser(user);
  delete userObj.passwordHash;
  res.json({ token, user: userObj });
});

// Request password reset (by email or phone) -> sends token via SMS/email
router.post('/password/request-reset', async (req, res) => {
  const { phone, email } = req.body;
  if (!phone && !email) return res.status(400).json({ error: 'phone or email required' });
  const user = await userStore.findOne({ $or: [{ phone }, { email }] });
  if (!user) return res.status(404).json({ error: 'User not found' });

  const token = crypto.randomBytes(20).toString('hex');
  user.resetToken = token;
  user.resetExpires = Date.now() + 3600 * 1000; // 1 hour
  await userStore.saveUser(user);

  const resetLink = `https://your-app.example/reset-password?token=${token}`;
  const smsBody = `Reset your password using this link: ${resetLink}`;
  if (user.phone) notification.sendSms(user.phone, smsBody);
  if (user.email) notification.sendEmail(user.email, 'Password reset', `Use this link to reset: ${resetLink}`);

  res.json({ ok: true });
});

// Perform password reset using token
router.post('/password/reset', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'token and password required' });
  const user = await userStore.findOne({ resetToken: token, resetExpires: { $gt: Date.now() } });
  if (!user) return res.status(400).json({ error: 'Invalid or expired token' });

  user.passwordHash = await bcrypt.hash(password, 10);
  user.resetToken = undefined;
  user.resetExpires = undefined;
  await user.save();

  res.json({ ok: true });
});

// Get user profile (requires auth)
router.get('/profile', require('../middleware/auth'), async (req, res) => {
  try {
    const user = await userStore.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const userObj = userStore.toPlainUser(user);
    delete userObj.passwordHash;
    res.json(userObj);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile (requires auth)
router.put('/profile', require('../middleware/auth'), async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const user = await userStore.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;

    await userStore.saveUser(user);
    const userObj = userStore.toPlainUser(user);
    delete userObj.passwordHash;
    res.json(userObj);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get user settings (requires auth)
router.get('/settings', require('../middleware/auth'), async (req, res) => {
  try {
    const user = await userStore.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({
      silentSOS: user.silentSOS || false,
      darkMode: user.darkMode || false,
      biometric: user.biometric !== false,
      locationShare: user.locationShare !== false,
      pushNotifs: user.pushNotifs !== false,
      autoCall: user.autoCall || false,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update user settings (requires auth)
router.put('/settings', require('../middleware/auth'), async (req, res) => {
  try {
    const { silentSOS, darkMode, biometric, locationShare, pushNotifs, autoCall } = req.body;
    const user = await userStore.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (silentSOS !== undefined) user.silentSOS = silentSOS;
    if (darkMode !== undefined) user.darkMode = darkMode;
    if (biometric !== undefined) user.biometric = biometric;
    if (locationShare !== undefined) user.locationShare = locationShare;
    if (pushNotifs !== undefined) user.pushNotifs = pushNotifs;
    if (autoCall !== undefined) user.autoCall = autoCall;

    await userStore.saveUser(user);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Admin: Get all users (requires auth)
router.get('/users', require('../middleware/auth'), async (req, res) => {
  try {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Admin: Get user by ID (requires auth)
router.get('/users/:id', require('../middleware/auth'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Admin: Update user (requires auth)
router.put('/users/:id', require('../middleware/auth'), async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (password) user.passwordHash = await bcrypt.hash(password, 10);

    await user.save();
    const userObj = user.toObject();
    delete userObj.passwordHash;
    res.json(userObj);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Admin: Delete user (requires auth)
router.delete('/users/:id', require('../middleware/auth'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    await User.deleteOne({ _id: req.params.id });
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Admin: Get user stats (requires auth)
router.get('/users/stats/overview', require('../middleware/auth'), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });
    res.json({ totalUsers, newUsersThisMonth });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Send OTP via Twilio Verify
router.post('/otp/send', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'phone required' });
    const result = await notification.sendOtp(phone);
    if (!result.ok) return res.status(500).json({ error: result.reason || 'Failed to send OTP' });
    res.json({ ok: true, status: result.status });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// Verify OTP code
router.post('/otp/verify', async (req, res) => {
  try {
    const { phone, code } = req.body;
    if (!phone || !code) return res.status(400).json({ error: 'phone and code required' });
    const result = await notification.verifyOtp(phone, code);
    if (!result.ok) return res.status(400).json({ error: 'Invalid or expired OTP', status: result.status });

    // If user exists, return a JWT token (auto-login after OTP)
    const user = await User.findOne({ phone });
    if (user) {
      const token = jwt.sign({ sub: user._id }, config.jwtSecret, { expiresIn: '30d' });
      const userObj = user.toObject();
      delete userObj.passwordHash;
      return res.json({ ok: true, token, user: userObj });
    }
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});


module.exports = router;
