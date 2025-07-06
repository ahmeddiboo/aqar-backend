const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "الاسم مطلوب"],
    trim: true,
  },
  phone: {
    type: String,
    required: [true, "رقم الهاتف مطلوب"],
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, "البريد الإلكتروني غير صالح"],
  },
  message: {
    type: String,
    required: [true, "الرسالة مطلوبة"],
    trim: true,
  },
  subject: {
    type: String,
    default: "استفسار عقاري",
    trim: true,
  },
  read: {
    type: Boolean,
    default: false,
  },
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Property",
  },
  propertyTitle: {
    type: String,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Message", MessageSchema);
