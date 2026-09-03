const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const auth = require('../middleware/auth');

router.use(auth);

router.post('/', async (req, res) => {
  const { name, phone, relationship } = req.body;
  if (!name || !phone) return res.status(400).json({ error: 'name and phone required' });
  const contact = await Contact.create({ owner: req.user._id, name, phone, relation: relationship });
  const populated = await contact.populate('owner', '-passwordHash');
  res.json(populated);
});

router.get('/', async (req, res) => {
  try {
    const list = await Contact.find({ owner: req.user._id })
      .populate('owner', '-passwordHash')
      .sort({ createdAt: -1 });
    // Transform relation field to relationship for consistency
    const transformed = list.map(c => ({
      ...c.toObject(),
      relationship: c.relation,
      userId: c.owner
    }));
    res.json(transformed);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const contact = await Contact.findOne({ _id: req.params.id, owner: req.user._id })
      .populate('owner', '-passwordHash');
    if (!contact) return res.status(404).json({ error: 'Contact not found' });
    res.json({
      ...contact.toObject(),
      relationship: contact.relation,
      userId: contact.owner
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch contact' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, phone, relationship } = req.body;
    const contact = await Contact.findOne({ _id: req.params.id, owner: req.user._id });
    if (!contact) return res.status(404).json({ error: 'Contact not found' });

    if (name) contact.name = name;
    if (phone) contact.phone = phone;
    if (relationship) contact.relation = relationship;

    await contact.save();
    const populated = await contact.populate('owner', '-passwordHash');
    res.json({
      ...populated.toObject(),
      relationship: populated.relation,
      userId: populated.owner
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update contact' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const contact = await Contact.findOne({ _id: req.params.id, owner: req.user._id });
    if (!contact) return res.status(404).json({ error: 'Contact not found' });
    await Contact.deleteOne({ _id: req.params.id, owner: req.user._id });
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete contact' });
  }
});

module.exports = router;
