import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import favoriteSchema from './Favorite.js';
import shoppingItemSchema from './ShoppingItem.js';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
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

export default mongoose.model('User', userSchema);
