const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const areaRateSchema = new Schema({
  name: {
    type: String,
    required: [true, "اسم المنطقة مطلوب"],
    trim: true,
    unique: true,
    maxlength: [100, "اسم المنطقة يجب أن لا يتجاوز 100 حرف"],
  },
  rate: {
    type: Number,
    required: [true, "سعر المتر مطلوب"],
    min: [1000, "سعر المتر يجب أن يكون أكبر من 1000 جنيه"],
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

// تحديث تاريخ التعديل عند تحديث البيانات
areaRateSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("AreaRate", areaRateSchema);
