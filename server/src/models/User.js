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
  { timestamps: true } // auto-manages createdAt / updatedAt on the user doc
);

// Hash a plain password and store it. Never store the raw password.
// genSalt(10) = 2^10 bcrypt rounds: enough to make brute-forcing a leaked hash
// expensive while staying fast enough for interactive login. The salt is baked
// into the resulting hash string, so no separate salt column is needed.
userSchema.methods.setPassword = async function (plainPassword) {
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(plainPassword, salt);
};

// Compare a login attempt against the stored hash. bcrypt.compare re-hashes the
// attempt with the salt embedded in passwordHash and does a constant-time
// compare, so we never decrypt anything. Returns a promise<boolean>.
userSchema.methods.verifyPassword = function (plainPassword) {
  return bcrypt.compare(plainPassword, this.passwordHash);
};

// Build the client-safe view of a user. We hand-pick fields (id/email/createdAt)
// rather than returning the doc so the passwordHash and reset-token fields can
// never accidentally be serialized into an API response.
userSchema.methods.toSafeJSON = function () {
  return { id: this._id, email: this.email, createdAt: this.createdAt };
};

// Generate a password-reset token: store its hash + expiry on the user and
// return the RAW token to email (only the user ever sees the raw value).
// This mirrors how passwords are handled — the DB holds only a hash, so a DB
// leak can't be replayed to reset accounts. The raw token is 32 random bytes
// (256 bits), far too large to guess. SHA-256 (not bcrypt) is fine here because
// the token is already high-entropy random, so it doesn't need slow hashing.
userSchema.methods.setResetToken = function () {
  const rawToken = crypto.randomBytes(32).toString('hex');
  this.resetTokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  this.resetTokenExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
  return rawToken;
};

// Clear a reset token once it's used (or should be invalidated) so it can't be
// reused. Setting to undefined unsets the fields on save (a token is single-use).
userSchema.methods.clearResetToken = function () {
  this.resetTokenHash = undefined;
  this.resetTokenExpires = undefined;
};

// Hash a raw token the same way setResetToken did, so the reset route can look
// a user up by resetTokenHash from the token in the emailed link. A static (not
// an instance method) because we hash before we've found which user it belongs to.
userSchema.statics.hashResetToken = function (rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
};

// Compile the schema into a model bound to the "users" collection (Mongoose
// lowercases + pluralizes the name). Unlike the embedded sub-schemas, this is a
// real model because users are their own top-level collection.
export default mongoose.model('User', userSchema);
