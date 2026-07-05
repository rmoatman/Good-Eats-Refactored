import mongoose from 'mongoose';

const { Schema } = mongoose;

// A single saved recipe. This is an embedded sub-document (no model() call),
// stored as an array on each User (User.favorites) — same pattern as the
// medList embedding, one document per user holds all their favorites.
const favoriteSchema = new Schema(
  {
    // Edamam recipe id (the part after #recipe_ in the uri). Uniquely
    // identifies the recipe so we can dedupe and delete by it.
    recipeId: { type: String, required: true },
    label: { type: String, required: true },
    image: { type: String },
    url: { type: String },
  },
  { timestamps: true } // records when each favorite was added
);

export default favoriteSchema;
