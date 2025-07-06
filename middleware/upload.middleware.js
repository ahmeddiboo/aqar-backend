const multer = require("multer");
const path = require("path");
const AppError = require("../utils/appError");

// Set up storage for uploaded files
const storage = multer.memoryStorage();

// Validate file types
const fileFilter = (req, file, cb) => {
  // Accept images only
  if (
    !file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF|webp|WEBP)$/)
  ) {
    return cb(new AppError("يُسمح فقط بملفات الصور", 400), false);
  }
  cb(null, true);
};

// Configure multer middleware
exports.upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: fileFilter,
});

// Middleware for single file upload
exports.single = (fieldName) => {
  return exports.upload.single(fieldName);
};

// Middleware for multiple file upload
exports.array = (fieldName, maxCount) => {
  return exports.upload.array(fieldName, maxCount);
};

// Handle file upload errors
exports.handleError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return next(
        new AppError("حجم الملف كبير جدًا. الحد الأقصى هو 5 ميغابايت", 400)
      );
    }
    return next(new AppError(`خطأ في تحميل الملف: ${err.message}`, 400));
  }
  next(err);
};
