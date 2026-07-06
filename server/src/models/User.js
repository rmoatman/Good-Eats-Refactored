// User model: stores the login email + bcrypt password hash, and embeds each
// user's favorites and shopping-list arrays on the same document (no separate
// collections/joins). Password helpers keep hashing/verification in one place.
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import favoriteSchema from './Favorite.js';
import shoppingItemSchema from './ShoppingItem.js';

// Password-reset tokens live for one hour.
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true, // enforces one account per address via a Mongo unique index
      lowercase: true, // normalize so signup/login are case-insensitive
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    // Each user's saved recipes, embedded directly on the user document.
    favorites: [favoriteSchema],
    // Each user's shopping-list items, also embedded on the user document.
    shoppingList: [shoppingItemSchema],
    // Password reset: we store only a HASH of the emailed token (so a DB leak
    // can't be used to reset passwords) plus its expiry.
    resetTokenHash: { type: String },
    resetTokenExpires: { type: Date },
  },
  { timestamps: true }
);

// Hash a plain password and store it. Never store the raw password.
userSchema.methods.setPassword = async function (plainPassword) {
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(plainPassword, salt);
};

// Compare a login attempt against the stored hash.
userSchema.methods.verifyPassword = function (plainPassword) {
  return bcrypt.compare(plainPassword, this.passwordHash);
};

// Never leak the hash when serializing to JSON.
userSchema.methods.toSafeJSON = function () {
  return { id: this._id, email: this.email, createdAt: this.createdAt };
};

// Generate a password-reset token: store its hash + expiry on the user and
// return the RAW token to email (only the user ever sees the raw value).
userSchema.methods.setResetToken = function () {
  const rawToken = crypto.randomBytes(32).toString('hex');
  this.resetTokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  this.resetTokenExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
  return rawToken;
};

// Clear a reset token once it's used (or should be invalidated).
userSchema.methods.clearResetToken = function () {
  this.resetTokenHash = undefined;
  this.resetTokenExpires = undefined;
};

// Hash a raw token the same way, for looking a user up by their reset token.
userSchema.statics.hashResetToken = function (rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
};

export default mongoose.model('User', userSchema);
