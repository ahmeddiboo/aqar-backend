const mongoose = require("mongoose");

const CustomerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "اسم العميل مطلوب"],
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
  interactions: [
    {
      type: {
        type: String,
        enum: ["phone", "whatsapp", "email", "in-person", "other"],
        required: true,
        default: "phone",
      },
      date: {
        type: Date,
        default: Date.now,
      },
      notes: {
        type: String,
        required: [true, "ملاحظات التفاعل مطلوبة"],
        trim: true,
      },
      agent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      callStatus: {
        type: String,
        enum: ["تم الرد", "لم يرد", "هاتف مغلق", "غير متاح"],
        default: "غير متاح",
      },
    },
  ],
  interests: [
    {
      type: String,
      enum: ["شقة", "فيلا", "دوبلكس", "استوديو", "محل", "أرض", "غير محدد"],
      default: "غير محدد",
    },
  ],
  status: {
    type: String,
    enum: ["مهتم", "غير مهتم", "متابعة لاحقاً", "قيد التفاوض", "تم الانتهاء"],
    default: "غير مهتم",
  },
  location: {
    type: String,
    trim: true,
  },
  budget: {
    min: {
      type: Number,
    },
    max: {
      type: Number,
    },
  },
  notes: {
    type: String,
    trim: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
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

// Update 'updatedAt' on every save
CustomerSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Customer = mongoose.model("Customer", CustomerSchema);
module.exports = Customer;
