const Message = require("../models/Message");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

// Create a new message
exports.createMessage = catchAsync(async (req, res, next) => {
  // Create the message in database
  const newMessage = await Message.create(req.body);

  res.status(201).json({
    status: "success",
    data: {
      message: newMessage,
    },
  });
});

// Get all messages - Admin only
exports.getAllMessages = catchAsync(async (req, res, next) => {
  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  // Find all messages, sorted by date (newest first)
  const messages = await Message.find()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  // Get total count for pagination
  const totalMessages = await Message.countDocuments();

  res.status(200).json({
    status: "success",
    results: messages.length,
    totalMessages,
    totalPages: Math.ceil(totalMessages / limit),
    currentPage: page,
    data: {
      messages,
    },
  });
});

// Get message by ID - Admin only
exports.getMessageById = catchAsync(async (req, res, next) => {
  const message = await Message.findById(req.params.id);

  if (!message) {
    return next(new AppError("لا توجد رسالة بهذا الرقم المعرف", 404));
  }

  // Mark as read if not already read
  if (!message.read) {
    message.read = true;
    await message.save();
  }

  res.status(200).json({
    status: "success",
    data: {
      message,
    },
  });
});

// Update message (mark as read/unread) - Admin only
exports.updateMessage = catchAsync(async (req, res, next) => {
  const message = await Message.findByIdAndUpdate(
    req.params.id,
    { read: req.body.read },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!message) {
    return next(new AppError("لا توجد رسالة بهذا الرقم المعرف", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      message,
    },
  });
});

// Delete message - Admin only
exports.deleteMessage = catchAsync(async (req, res, next) => {
  const message = await Message.findByIdAndDelete(req.params.id);

  if (!message) {
    return next(new AppError("لا توجد رسالة بهذا الرقم المعرف", 404));
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});
