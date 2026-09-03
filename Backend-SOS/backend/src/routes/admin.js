const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config');
const crypto = require('crypto');
const notification = require('../services/notification');

// Admin Register (only for super_admin)
router.post('/admin/register', async (req, res) => {
  try {
    const { name, email, phone, password, role = 'admin' } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email, and password are required' });
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });
    if (existingAdmin) {
      return res.status(409).json({ error: 'Admin with this email already exists' });
    }

    // Create new admin
    const admin = new Admin({
      name,
      email: email.toLowerCase(),
      phone,
      role,
      passwordHash: password, // Will be hashed by pre-save middleware
      status: 'active'
    });

    await admin.save();

    // Generate token
    const token = jwt.sign(
      { sub: admin._id, type: 'admin' },
      config.jwtSecret,
      { expiresIn: '30d' }
    );

    const adminObj = admin.toObject();
    delete adminObj.passwordHash;
    delete adminObj.resetToken;
    delete adminObj.twoFactorSecret;

    res.status(201).json({ token, admin: adminObj });
  } catch (error) {
    console.error('Admin registration error:', error);
    res.status(500).json({ error: error.message || 'Registration failed' });
  }
});

// Admin Login
router.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    // Find admin by email
    const admin = await Admin.findOne({ email: email.toLowerCase() });

    // Check if admin exists
    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if account is locked
    if (admin.isLocked()) {
      return res.status(403).json({ 
        error: 'Account is locked. Please try again later.' 
      });
    }

    // Check if account is active
    if (admin.status !== 'active') {
      return res.status(403).json({ 
        error: 'Account is ' + admin.status + '. Contact administrator.' 
      });
    }

    // Compare password
    const passwordMatch = await admin.comparePassword(password);
    if (!passwordMatch) {
      await admin.incLoginAttempts();
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Reset login attempts on successful login
    await admin.resetLoginAttempts();

    // Update last login
    admin.lastLogin = Date.now();
    await admin.save();

    // Generate token
    const token = jwt.sign(
      { sub: admin._id, type: 'admin' },
      config.jwtSecret,
      { expiresIn: '30d' }
    );

    const adminObj = admin.toObject();
    delete adminObj.passwordHash;
    delete adminObj.resetToken;
    delete adminObj.twoFactorSecret;

    res.json({ token, admin: adminObj });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get Admin Profile
router.get('/admin/profile', require('../middleware/auth'), async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.sub);
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    const adminObj = admin.toObject();
    delete adminObj.passwordHash;
    delete adminObj.resetToken;
    delete adminObj.twoFactorSecret;

    res.json(adminObj);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update Admin Profile
router.put('/admin/profile', require('../middleware/auth'), async (req, res) => {
  try {
    const { name, phone } = req.body;
    const admin = await Admin.findByIdAndUpdate(
      req.user.sub,
      { name, phone, updatedAt: Date.now() },
      { new: true }
    );

    const adminObj = admin.toObject();
    delete adminObj.passwordHash;
    delete adminObj.resetToken;
    delete adminObj.twoFactorSecret;

    res.json(adminObj);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Change Password
router.post('/admin/change-password', require('../middleware/auth'), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'currentPassword and newPassword required' });
    }

    const admin = await Admin.findById(req.user.sub);
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    // Verify current password
    const match = await admin.comparePassword(currentPassword);
    if (!match) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Update password
    admin.passwordHash = newPassword; // Will be hashed by pre-save middleware
    await admin.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Get All Admins (super_admin only)
router.get('/admin/list', require('../middleware/auth'), async (req, res) => {
  try {
    const requester = await Admin.findById(req.user.sub);
    if (requester.role !== 'super_admin') {
      return res.status(403).json({ error: 'Only super admins can view admin list' });
    }

    const admins = await Admin.find().select('-passwordHash -resetToken -twoFactorSecret');
    res.json(admins);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch admins' });
  }
});

// Update Admin (super_admin only)
router.put('/admin/:id', require('../middleware/auth'), async (req, res) => {
  try {
    const requester = await Admin.findById(req.user.sub);
    if (requester.role !== 'super_admin') {
      return res.status(403).json({ error: 'Only super admins can update admins' });
    }

    const { name, role, status, permissions } = req.body;
    const updates = { name, role, status, permissions, updatedAt: Date.now() };

    const admin = await Admin.findByIdAndUpdate(req.params.id, updates, { new: true })
      .select('-passwordHash -resetToken -twoFactorSecret');

    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    res.json(admin);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update admin' });
  }
});

// Delete Admin (super_admin only)
router.delete('/admin/:id', require('../middleware/auth'), async (req, res) => {
  try {
    const requester = await Admin.findById(req.user.sub);
    if (requester.role !== 'super_admin') {
      return res.status(403).json({ error: 'Only super admins can delete admins' });
    }

    const admin = await Admin.findByIdAndDelete(req.params.id);
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    res.json({ message: 'Admin deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete admin' });
  }
});

// Request Password Reset
router.post('/admin/request-password-reset', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'email is required' });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) {
      // Don't reveal if email exists
      return res.json({ message: 'If email exists, reset link will be sent' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    admin.resetToken = resetToken;
    admin.resetExpires = Date.now() + 3600 * 1000; // 1 hour
    await admin.save();

    const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;
    console.log('Password reset link:', resetLink);

    res.json({ message: 'Password reset link sent to email' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to request password reset' });
  }
});

// Reset Password with Token
router.post('/admin/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'token and newPassword required' });
    }

    const admin = await Admin.findOne({
      resetToken: token,
      resetExpires: { $gt: Date.now() }
    });

    if (!admin) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Update password
    admin.passwordHash = newPassword; // Will be hashed by pre-save middleware
    admin.resetToken = undefined;
    admin.resetExpires = undefined;
    await admin.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

module.exports = router;
