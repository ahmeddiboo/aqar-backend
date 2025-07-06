const User = require("../models/User");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

// Get all users - Admin only
exports.getAllUsers = catchAsync(async (req, res, next) => {
  // Use pagination for better performance
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const users = await User.find().select("-password").skip(skip).limit(limit);
  const totalUsers = await User.countDocuments();

  res.status(200).json({
    status: "success",
    results: users.length,
    totalUsers,
    totalPages: Math.ceil(totalUsers / limit),
    currentPage: page,
    data: {
      users,
    },
  });
});

// Get user by ID - Admin only
exports.getUserById = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id).select("-password");

  if (!user) {
    return next(new AppError("لا يوجد مستخدم بهذا الرقم المعرف", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      user,
    },
  });
});

// Update user - Admin only
exports.updateUser = catchAsync(async (req, res, next) => {
  // Prevent password updates through this route
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError("هذا الرابط غير مخصص لتحديث كلمة المرور", 400));
  }

  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).select("-password");

  if (!user) {
    return next(new AppError("لا يوجد مستخدم بهذا الرقم المعرف", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      user,
    },
  });
});

// Delete user - Admin only
exports.deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);

  if (!user) {
    return next(new AppError("لا يوجد مستخدم بهذا الرقم المعرف", 404));
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});
