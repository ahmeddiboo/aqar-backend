const Property = require("../models/Property");
const User = require("../models/User");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

// Get dashboard statistics
exports.getDashboardStats = catchAsync(async (req, res, next) => {
  // Get properties count
  const propertiesCount = await Property.countDocuments();

  // Get properties pending count
  const propertiesPending = await Property.countDocuments({
    status: "pending",
  });

  // Get users count (excluding admins)
  const usersCount = await User.countDocuments({ role: { $ne: "admin" } });

  // Calculate popular locations
  const popularLocations = await Property.aggregate([
    { $match: { status: "approved" } },
    { $group: { _id: "$location", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 4 },
    { $project: { _id: 0, name: "$_id", count: 1 } },
  ]);

  // Get recent properties
  const recentProperties = await Property.find()
    .sort({ createdAt: -1 })
    .limit(3)
    .select("title price location status createdAt");
  // Get messages count
  const Message = require("../models/Message"); // Import Message model
  const messagesCount = await Message.countDocuments();
  const unreadMessagesCount = await Message.countDocuments({ read: false });

  res.status(200).json({
    status: "success",
    data: {
      propertiesCount,
      propertiesPending,
      usersCount,
      messagesCount,
      unreadMessagesCount,
      popularLocations,
      recentProperties,
    },
  });
});

// Get all properties with filters for admin
exports.getAllProperties = catchAsync(async (req, res, next) => {
  // Build query
  const queryObj = { ...req.query };
  const excludedFields = ["page", "sort", "limit", "fields"];
  excludedFields.forEach((field) => delete queryObj[field]);
  // Remove empty string filters and handle boolean strings
  Object.keys(queryObj).forEach((key) => {
    if (queryObj[key] === "") {
      delete queryObj[key];
    }
    // Handle 'true' and 'false' strings for featured filter
    if (key === "featured") {
      if (queryObj[key] === "true") {
        queryObj[key] = true;
      } else if (queryObj[key] === "false") {
        queryObj[key] = false;
      }
    }
  });

  // Advanced filtering
  let queryStr = JSON.stringify(queryObj);
  queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

  // Find all properties (admin can see all statuses)
  const query = Property.find(JSON.parse(queryStr));

  // Sorting
  if (req.query.sort) {
    const sortBy = req.query.sort.split(",").join(" ");
    query.sort(sortBy);
  } else {
    query.sort("-createdAt");
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  query.skip(skip).limit(limit);
  // Execute query
  const properties = await query;

  // Get total count for pagination
  const totalProperties = await Property.countDocuments(JSON.parse(queryStr));

  res.status(200).json({
    status: "success",
    results: properties.length,
    totalProperties,
    totalPages: Math.ceil(totalProperties / limit),
    currentPage: page,
    data: {
      properties,
    },
  });
});

// Get all users for admin
exports.getAllUsers = catchAsync(async (req, res, next) => {
  // Build query
  const queryObj = { ...req.query };
  const excludedFields = ["page", "sort", "limit", "fields"];
  excludedFields.forEach((field) => delete queryObj[field]);

  // Advanced filtering
  let queryStr = JSON.stringify(queryObj);
  queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

  // Find all users
  const query = User.find(JSON.parse(queryStr));

  // Sorting
  if (req.query.sort) {
    const sortBy = req.query.sort.split(",").join(" ");
    query.sort(sortBy);
  } else {
    query.sort("-createdAt");
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  query.skip(skip).limit(limit);

  // Execute query
  const users = await query;

  // Get total count for pagination
  const totalUsers = await User.countDocuments(JSON.parse(queryStr));

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

// Get user by ID
exports.getUserById = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError("لم يتم العثور على المستخدم", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      user,
    },
  });
});

// Update user
exports.updateUser = catchAsync(async (req, res, next) => {
  // Prevent password update through this route
  if (req.body.password) {
    delete req.body.password;
  }

  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    return next(new AppError("لم يتم العثور على المستخدم", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      user,
    },
  });
});

// Delete user
exports.deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);

  if (!user) {
    return next(new AppError("لم يتم العثور على المستخدم", 404));
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});

// Get property by ID for edit
exports.getPropertyById = catchAsync(async (req, res, next) => {
  const property = await Property.findById(req.params.id);

  if (!property) {
    return next(new AppError("لم يتم العثور على العقار", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      property,
    },
  });
});

// Update property
exports.updateProperty = catchAsync(async (req, res, next) => {
  const property = await Property.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!property) {
    return next(new AppError("لم يتم العثور على العقار", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      property,
    },
  });
});
