const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const propertyPaymentPlanSchema = new Schema({
  property: {
    type: Schema.Types.ObjectId,
    ref: "Property",
    required: [true, "يجب تحديد الوحدة المرتبطة بخطة الدفع"],
  },
  title: {
    type: String,
    required: [true, "عنوان خطة الدفع مطلوب"],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  price: {
    type: Number,
    required: [true, "سعر الوحدة مطلوب"],
    min: [0, "السعر يجب أن يكون أكبر من صفر"],
  },
  downPayment: {
    type: Number, // نسبة الدفعة المقدمة
    required: [true, "نسبة الدفعة المقدمة مطلوبة"],
    min: [0, "نسبة الدفعة المقدمة يجب أن تكون أكبر من أو تساوي صفر"],
    max: [100, "نسبة الدفعة المقدمة يجب أن تكون أقل من أو تساوي 100"],
  },
  installmentPeriod: {
    type: Number, // فترة التقسيط بالشهور
    required: [true, "فترة التقسيط مطلوبة"],
    min: [1, "فترة التقسيط يجب أن تكون شهر واحد على الأقل"],
  },
  installmentAmount: {
    type: Number, // قيمة القسط الشهري
    min: [0, "قيمة القسط يجب أن تكون أكبر من صفر"],
  },
  active: {
    type: Boolean,
    default: true,
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
propertyPaymentPlanSchema.pre("save", function (next) {
  // Calculate installment amount if not provided
  if (
    !this.installmentAmount &&
    this.price &&
    this.downPayment &&
    this.installmentPeriod
  ) {
    const downPaymentAmount = (this.price * this.downPayment) / 100;
    const remainingAmount = this.price - downPaymentAmount;
    this.installmentAmount = remainingAmount / this.installmentPeriod;
  }

  this.updatedAt = Date.now();
  next();
});

// Create PropertyPaymentPlan model
const PropertyPaymentPlan = mongoose.model(
  "PropertyPaymentPlan",
  propertyPaymentPlanSchema
);

module.exports = PropertyPaymentPlan;
