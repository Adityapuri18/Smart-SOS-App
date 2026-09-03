const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');

const memoryUsers = [];

function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

function toPlainUser(user) {
  if (!user) return null;
  if (typeof user.toObject === 'function') {
    return user.toObject();
  }
  return { ...user };
}

function queryMatches(user, query) {
  if (!query || typeof query !== 'object') return false;

  if (query.$or) {
    return query.$or.some((part) => queryMatches(user, part));
  }

  return Object.entries(query).every(([key, value]) => {
    if (key === '_id' && value && typeof value === 'object' && typeof value.equals === 'function') {
      return value.equals(user._id);
    }
    return user[key] === value;
  });
}

async function createUser(data) {
  if (isDbConnected()) {
    return User.create(data);
  }

  const user = {
    _id: data._id || crypto.randomUUID(),
    phone: data.phone,
    email: data.email,
    name: data.name,
    passwordHash: data.passwordHash,
    deviceToken: data.deviceToken,
    resetToken: data.resetToken,
    resetExpires: data.resetExpires,
    createdAt: new Date(),
  };

  memoryUsers.push(user);
  return user;
}

async function findOne(query) {
  if (isDbConnected()) {
    return User.findOne(query);
  }

  return memoryUsers.find((user) => queryMatches(user, query)) || null;
}

async function findById(id) {
  if (isDbConnected()) {
    return User.findById(id).select('-passwordHash');
  }

  return memoryUsers.find((user) => String(user._id) === String(id)) || null;
}

async function saveUser(user) {
  if (isDbConnected()) {
    return user.save();
  }

  const existingIndex = memoryUsers.findIndex((item) => String(item._id) === String(user._id));
  if (existingIndex >= 0) {
    memoryUsers[existingIndex] = { ...memoryUsers[existingIndex], ...user };
    return memoryUsers[existingIndex];
  }

  memoryUsers.push({ ...user });
  return memoryUsers[memoryUsers.length - 1];
}

async function deleteUser(id) {
  if (isDbConnected()) {
    return User.deleteOne({ _id: id });
  }

  const index = memoryUsers.findIndex((user) => String(user._id) === String(id));
  if (index >= 0) {
    memoryUsers.splice(index, 1);
  }
  return { deletedCount: index >= 0 ? 1 : 0 };
}

async function countUsers() {
  if (isDbConnected()) {
    return User.countDocuments();
  }
  return memoryUsers.length;
}

module.exports = {
  createUser,
  findOne,
  findById,
  saveUser,
  deleteUser,
  countUsers,
  toPlainUser,
};
