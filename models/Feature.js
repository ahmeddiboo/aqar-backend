const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const featureSchema = new Schema({
  id: {
    type: String,
    required: [true, "معرف الميزة مطلوب"],
    trim: true,
    unique: true,
    index: true,
  },
  name: {
    type: String,
    required: [true, "اسم الميزة مطلوب"],
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt timestamp before saving
featureSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Create Feature model
const Feature = mongoose.model("Feature", featureSchema);

module.exports = Feature;
