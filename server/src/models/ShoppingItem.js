// ShoppingItem sub-schema — exported schema only (not a compiled model) so it
// can be embedded as an array on the User document. See usage in User.shoppingList.
import mongoose from 'mongoose';

const { Schema } = mongoose;

// A single shopping-list line. Embedded as an array on each User
// (User.shoppingList) — same pattern as favorites. Each item remembers
// which recipe it came from so the UI can group items by recipe.
const shoppingItemSchema = new Schema(
  {
    text: { type: String, required: true },       // the ingredient line
    recipeLabel: { type: String, default: '' },   // source recipe name
    checked: { type: Boolean, default: false },   // ticked off in the UI
  },
  { timestamps: true }
);

export default shoppingItemSchema;
