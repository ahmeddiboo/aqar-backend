const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const propertySchema = new Schema({
  title: {
    type: String,
    required: [true, "عنوان العقار مطلوب"],
    trim: true,
    maxlength: [100, "عنوان العقار يجب أن لا يتجاوز 100 حرف"],
  },
  description: {
    type: String,
    required: [true, "وصف العقار مطلوب"],
    trim: true,
  },
  type: {
    type: String,
    required: [true, "نوع العقار مطلوب"],
    enum: {
      values: ["شقة", "فيلا", "محل", "أرض"],
      message: "نوع العقار يجب أن يكون شقة، فيلا، محل أو أرض",
    },
  },
  project: {
    type: Schema.Types.ObjectId,
    ref: "Project",
  },
  hasPaymentPlan: {
    type: Boolean,
    default: false,
  },
  purpose: {
    type: String,
    required: [true, "الغرض مطلوب"],
    enum: {
      values: ["بيع", "إيجار"],
      message: "الغرض يجب أن يكون بيع أو إيجار",
    },
  },
  location: {
    type: String,
    required: [true, "موقع العقار مطلوب"],
    trim: true,
  },
  coordinates: {
    lat: {
      type: Number,
    },
    lng: {
      type: Number,
    },
  },
  price: {
    type: Number,
    required: [true, "سعر العقار مطلوب"],
    min: [0, "السعر يجب أن يكون أكبر من صفر"],
  },
  area: {
    type: Number,
    required: [true, "مساحة العقار مطلوبة"],
    min: [0, "المساحة يجب أن تكون أكبر من صفر"],
  },
  rooms: {
    type: Number,
    default: 0,
    min: [0, "عدد الغرف يجب أن يكون أكبر من أو يساوي صفر"],
  },
  bathrooms: {
    type: Number,
    default: 0,
    min: [0, "عدد الحمامات يجب أن يكون أكبر من أو يساوي صفر"],
  },
  features: [String],
  images: [String], // Array of image URLs
  mainImage: {
    type: String,
    default: "",
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "يجب تحديد المستخدم المنشئ للعقار"],
  },
  status: {
    type: String,
    enum: {
      values: ["pending", "approved", "rejected"],
      message: "الحالة يجب أن تكون pending, approved, أو rejected",
    },
    default: "pending",
  },
  contactPhone: {
    type: String,
    required: [true, "رقم الهاتف للتواصل مطلوب"],
  },
  contactEmail: {
    type: String,
    match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, "البريد الإلكتروني غير صالح"],
  },
  views: {
    type: Number,
    default: 0,
  },
  featured: {
    type: Boolean,
    default: false,
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
propertySchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Create Property model
const Property = mongoose.model("Property", propertySchema);

module.exports = Property;
