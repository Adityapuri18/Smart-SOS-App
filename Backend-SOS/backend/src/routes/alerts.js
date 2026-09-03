const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');
const Contact = require('../models/Contact');
const auth = require('../middleware/auth');
const notification = require('../services/notification');

router.use(auth);

// Get all active alerts with locations
router.get('/', async (req, res) => {
  try {
    const alerts = await Alert.find()
      .populate('owner', '-passwordHash')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// Get single alert by ID
router.get('/:id', async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id).populate('owner', '-passwordHash');
    if (!alert) return res.status(404).json({ error: 'Alert not found' });
    res.json(alert);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch alert' });
  }
});

// Trigger SOS: creates alert, notifies contacts, emits via Socket.IO
router.post('/trigger', async (req, res) => {
  const { latitude, longitude, message } = req.body;
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    console.warn('[Alerts] Received trigger with missing/invalid coordinates');
    return res.status(400).json({ error: 'latitude and longitude required' });
  }

  console.log(`[Alerts] Trigger received from User ${req.user._id} | Location: ${latitude}, ${longitude}`);

  const alert = await Alert.create({
    owner: req.user._id,
    location: { coordinates: [longitude, latitude] },
    message: message || 'SOS! Need help',
    active: true
  });

  console.log(`[Alerts] Created Alert object: ${alert._id}`);

  // Fetch contacts and send SMS & Call
  const contacts = await Contact.find({ owner: req.user._id });
  console.log(`[Alerts] Found ${contacts.length} emergency contacts for this user.`);

  const smsBody = `${req.user.name || 'User'} needs help: ${message || ''} Location: https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  const callMessage = `${req.user.name || 'User'} has triggered an S.O.S alert. ${message ? `Their message is: ${message}. ` : ''}Please check the app for their live location.`;

  const notificationsEnabled = notification.isConfigured();
  if (!notificationsEnabled) {
    console.warn('[Alerts] Twilio is not configured; SMS/call notifications are disabled for this alert.');
  }

  const notificationPromises = [];

  for (const c of contacts) {
    if (!c.phone) {
      console.warn(`[Alerts] Contact ${c.name} has no phone number, skipping.`);
      continue;
    }
    console.log(`[Alerts] Notifying ${c.name} (${c.phone})...`);

    if (notificationsEnabled) {
      notificationPromises.push(notification.sendSms(c.phone, smsBody));
      notificationPromises.push(notification.sendCall(c.phone, callMessage));
    }
  }

  if (notificationPromises.length > 0) {
    await Promise.allSettled(notificationPromises);
  }
  console.log(`[Alerts] Completed notification attempts for ${contacts.length} contacts.`);

  // Emit to Socket.IO room for owner
  const io = req.app.get('io');
  if (io) {
    io.to(String(req.user._id)).emit('alert:triggered', { alert });
    console.log(`[Alerts] Emitted trigger to Socket.IO room ${req.user._id}`);
  }

  res.json({ alert, notified: contacts.length, notificationsEnabled });
});

// Update location for active alert (live tracking)
router.post('/:id/location', async (req, res) => {
  const { latitude, longitude } = req.body;
  const alert = await Alert.findOne({ _id: req.params.id, owner: req.user._id });
  if (!alert) return res.status(404).json({ error: 'Alert not found' });
  alert.location = { type: 'Point', coordinates: [longitude, latitude] };
  await alert.save();
  const io = req.app.get('io');
  if (io) io.to(String(req.user._id)).emit('alert:location', { id: alert._id, latitude, longitude });
  res.json({ ok: true });
});

// Mark as safe / stop SOS
router.post('/:id/stop', async (req, res) => {
  const alert = await Alert.findOne({ _id: req.params.id, owner: req.user._id });
  if (!alert) return res.status(404).json({ error: 'Alert not found' });
  alert.active = false;
  await alert.save();
  const io = req.app.get('io');
  if (io) io.to(String(req.user._id)).emit('alert:stopped', { id: alert._id });
  res.json({ ok: true });
});

// Update alert (for admin)
router.put('/:id', async (req, res) => {
  try {
    const { message, active } = req.body;
    const alert = await Alert.findById(req.params.id);
    if (!alert) return res.status(404).json({ error: 'Alert not found' });

    if (message) alert.message = message;
    if (active !== undefined) alert.active = active;

    await alert.save();
    const populated = await alert.populate('owner', '-passwordHash');
    res.json(populated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update alert' });
  }
});

// Delete alert (for admin)
router.delete('/:id', async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) return res.status(404).json({ error: 'Alert not found' });
    
    await Alert.deleteOne({ _id: req.params.id });
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete alert' });
  }
});

// Get alert stats
router.get('/stats/overview', async (req, res) => {
  try {
    const totalAlerts = await Alert.countDocuments();
    const activeAlerts = await Alert.countDocuments({ active: true });
    const alertsThisMonth = await Alert.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });
    res.json({ totalAlerts, activeAlerts, alertsThisMonth });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;
