const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const projectSchema = new Schema({
  title: {
    type: String,
    required: [true, "عنوان المشروع مطلوب"],
    trim: true,
    maxlength: [100, "عنوان المشروع يجب أن لا يتجاوز 100 حرف"],
  },
  description: {
    type: String,
    required: [true, "وصف المشروع مطلوب"],
    trim: true,
  },
  location: {
    type: String,
    required: [true, "موقع المشروع مطلوب"],
    trim: true,
  },
  area: {
    type: Number,
    required: [true, "مساحة المشروع مطلوبة"],
    min: [0, "المساحة يجب أن تكون أكبر من صفر"],
  },
  developer: {
    type: String,
    trim: true,
  },
  features: [String], // Array of features
  images: [String], // Array of image URLs
  mainImage: {
    type: String,
    default: "",
  },
  status: {
    type: String,
    enum: {
      values: ["قيد الإنشاء", "مكتمل", "متاح للبيع"],
      message: "الحالة يجب أن تكون قيد الإنشاء، مكتمل، أو متاح للبيع",
    },
    default: "متاح للبيع",
  },
  completionDate: {
    type: Date,
  },
  units: {
    type: Number,
    default: 0,
    min: [0, "عدد الوحدات يجب أن يكون أكبر من أو يساوي صفر"],
  },
  availableUnits: {
    type: Number,
    default: 0,
    min: [0, "عدد الوحدات المتاحة يجب أن يكون أكبر من أو يساوي صفر"],
  },
  unitTypes: [String], // Array of unit types (e.g. شقق، فلل، محلات)
  projectTypes: {
    type: [String], // Array of project types (e.g. سكني، تجاري، إداري)
    validate: {
      validator: function (types) {
        const validTypes = ["سكني", "تجاري", "إداري"];
        return types.every((type) => validTypes.includes(type));
      },
      message: "أنواع المشروع يجب أن تكون سكني، تجاري، أو إداري",
    },
  },
  coordinates: {
    lat: {
      type: Number,
    },
    lng: {
      type: Number,
    },
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
projectSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Create Project model
const Project = mongoose.model("Project", projectSchema);

module.exports = Project;
