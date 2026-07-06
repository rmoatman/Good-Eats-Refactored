// Favorite sub-schema — exported schema only (not a compiled model) so it can
// be embedded as an array on the User document. See usage in User.favorites.
import mongoose from 'mongoose';

const { Schema } = mongoose;

// A single saved recipe. This is an embedded sub-document (no model() call),
// stored as an array on each User (User.favorites) — one user document holds
// all of their favorites, same embedding pattern as the shopping list.
const favoriteSchema = new Schema(
  {
    // The recipe's Spoonacular id (as a string). Uniquely identifies the
    // recipe so we can dedupe on add and delete by it.
    recipeId: { type: String, required: true },
    label: { type: String, required: true },
    image: { type: String },
    url: { type: String },
  },
  { timestamps: true } // records when each favorite was added
);

// Exported as a schema, not mongoose.model(...) — embedding it in User.favorites
// is what gives it persistence. Each embedded favorite still gets its own _id
// from Mongoose, which the favorites routes can use to address a single entry.
export default favoriteSchema;
