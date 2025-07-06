const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const crypto = require("crypto");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const sendEmail = require("../utils/email");

// Create and send JWT token
const signToken = (id) => {
  // Always use a valid expiration time to avoid "option expires is invalid" error
  const expiresIn = "30d";
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn });
};

// Send token as response
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  // Set cookie options
  const cookieOptions = {
    expires: new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds
    ),
    httpOnly: true,
  };

  // Set secure flag in production
  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;

  // Remove password from output
  user.password = undefined;

  // Send cookie and response
  res.cookie("jwt", token, cookieOptions);

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

// Register new user
exports.register = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  createSendToken(newUser, 201, res);
});

// Login user
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // Check if email and password are provided
  if (!email || !password) {
    return next(
      new AppError("الرجاء إدخال البريد الإلكتروني وكلمة المرور", 400)
    );
  }

  // Find user by email and include password field
  const user = await User.findOne({ email }).select("+password");

  // Check if user exists and password is correct
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(
      new AppError("البريد الإلكتروني أو كلمة المرور غير صحيحة", 401)
    );
  }

  // Send token to client
  createSendToken(user, 200, res);
});

// Forgot password
exports.forgotPassword = catchAsync(async (req, res, next) => {
  // Get user by email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError("لا يوجد مستخدم بهذا البريد الإلكتروني", 404));
  }

  // Generate reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // Create reset URL
  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/auth/reset-password/${resetToken}`;

  // Email message
  const message = `هل نسيت كلمة المرور؟ يرجى استخدام الرابط التالي لإعادة تعيين كلمة المرور: ${resetURL}
  \nإذا لم تطلب إعادة تعيين كلمة المرور، فيرجى تجاهل هذا البريد.`;

  try {
    await sendEmail({
      email: user.email,
      subject: "رابط إعادة تعيين كلمة المرور (صالح لمدة 10 دقائق فقط)",
      message,
    });

    res.status(200).json({
      status: "success",
      message: "تم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        "حدث خطأ في إرسال البريد الإلكتروني. الرجاء المحاولة مرة أخرى لاحقًا!",
        500
      )
    );
  }
});

// Reset password
exports.resetPassword = catchAsync(async (req, res, next) => {
  // Get user based on the token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // Check if token is valid and not expired
  if (!user) {
    return next(new AppError("الرابط غير صالح أو منتهي الصلاحية", 400));
  }

  // Set new password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // Log the user in, send JWT
  createSendToken(user, 200, res);
});

// Get current user profile
exports.getMe = catchAsync(async (req, res, next) => {
  res.status(200).json({
    status: "success",
    data: {
      user: req.user,
    },
  });
});

// Update current user details (except password)
exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Check if user is trying to update password
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        "هذا الرابط غير مخصص لتحديث كلمة المرور. الرجاء استخدام /update-my-password.",
        400
      )
    );
  }

  // 2) Filter unwanted fields that users shouldn't update
  const filteredBody = {};
  const allowedFields = ["name", "email", "phone", "address"];

  Object.keys(req.body).forEach((field) => {
    if (allowedFields.includes(field)) {
      filteredBody[field] = req.body[field];
    }
  });

  // 3) Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: "success",
    data: {
      user: updatedUser,
    },
  });
});

// Update current user password
exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  const user = await User.findById(req.user.id).select("+password");

  // 2) Check if current password is correct
  if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
    return next(new AppError("كلمة المرور الحالية غير صحيحة", 401));
  }

  // 3) Update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  // 4) Log user in, send JWT
  createSendToken(user, 200, res);
});
