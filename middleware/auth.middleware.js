const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const User = require("../models/User");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

// Protect routes - verify JWT token
exports.protect = catchAsync(async (req, res, next) => {
  // Check if token exists in headers
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError("أنت غير مسجل الدخول. الرجاء تسجيل الدخول للوصول", 401)
    );
  }

  let decoded;
  let currentUser;

  try {
    // Verify token
    decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // Check if user still exists
    currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(
        new AppError("المستخدم المرتبط بهذا الرمز لم يعد موجودًا", 401)
      );
    }
  } catch (error) {
    console.error("JWT verification error:", error.message);
    return next(
      new AppError("غير مصرح لك بالوصول. الرجاء تسجيل الدخول مرة أخرى.", 401)
    );
  }

  // Check if user changed password after token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError(
        "تم تغيير كلمة المرور مؤخرًا. الرجاء تسجيل الدخول مرة أخرى",
        401
      )
    );
  }

  // Grant access to protected route
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

// Restrict access to specific user roles
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError("ليس لديك الصلاحية للقيام بهذا الإجراء", 403));
    }
    next();
  };
};

// Check ownership of resource
exports.isOwner = (Model) => {
  return catchAsync(async (req, res, next) => {
    const resource = await Model.findById(req.params.id);

    if (!resource) {
      return next(new AppError("لم يتم العثور على العنصر المطلوب", 404));
    }

    // Check if current user is owner of resource
    if (
      resource.createdBy.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return next(new AppError("ليس لديك الصلاحية للوصول إلى هذا العنصر", 403));
    }

    next();
  });
};
