const Customer = require("../models/Customer");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

// Create a new customer
exports.createCustomer = catchAsync(async (req, res, next) => {
  // Add the current admin as the creator
  req.body.createdBy = req.user.id;

  // Create the customer in database
  const newCustomer = await Customer.create(req.body);

  res.status(201).json({
    status: "success",
    data: {
      customer: newCustomer,
    },
  });
});

// Get all customers with pagination and filtering
exports.getAllCustomers = catchAsync(async (req, res, next) => {
  // Build query
  const queryObj = { ...req.query };
  const excludedFields = ["page", "sort", "limit", "fields"];
  excludedFields.forEach((field) => delete queryObj[field]);

  // Advanced filtering
  let queryStr = JSON.stringify(queryObj);
  queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

  // Find all customers
  const query = Customer.find(JSON.parse(queryStr));

  // Sorting
  if (req.query.sort) {
    const sortBy = req.query.sort.split(",").join(" ");
    query.sort(sortBy);
  } else {
    query.sort("-createdAt"); // Default sort by newest
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  query.skip(skip).limit(limit);

  // Execute query
  const customers = await query;

  // Get total count for pagination
  const totalCustomers = await Customer.countDocuments(JSON.parse(queryStr));

  res.status(200).json({
    status: "success",
    results: customers.length,
    totalCustomers,
    totalPages: Math.ceil(totalCustomers / limit),
    currentPage: page,
    data: {
      customers,
    },
  });
});

// Get a specific customer by ID
exports.getCustomerById = catchAsync(async (req, res, next) => {
  const customer = await Customer.findById(req.params.id).populate({
    path: "interactions.agent",
    select: "name",
  });

  if (!customer) {
    return next(new AppError("لا يوجد عميل بهذا المعرف", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      customer,
    },
  });
});

// Update a customer
exports.updateCustomer = catchAsync(async (req, res, next) => {
  const updatedCustomer = await Customer.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!updatedCustomer) {
    return next(new AppError("لا يوجد عميل بهذا المعرف", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      customer: updatedCustomer,
    },
  });
});

// Delete a customer
exports.deleteCustomer = catchAsync(async (req, res, next) => {
  const customer = await Customer.findByIdAndDelete(req.params.id);

  if (!customer) {
    return next(new AppError("لا يوجد عميل بهذا المعرف", 404));
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});

// Add a new interaction to a customer
exports.addInteraction = catchAsync(async (req, res, next) => {
  const customer = await Customer.findById(req.params.id);

  if (!customer) {
    return next(new AppError("لا يوجد عميل بهذا المعرف", 404));
  }

  // Add agent to the interaction
  req.body.agent = req.user.id;

  // Add new interaction
  customer.interactions.push(req.body);

  // Update customer status if provided
  if (req.body.customerStatus) {
    customer.status = req.body.customerStatus;
  }

  // Add interests if provided
  if (req.body.interests && req.body.interests.length > 0) {
    customer.interests = [
      ...new Set([...customer.interests, ...req.body.interests]),
    ];
  }

  await customer.save();

  res.status(200).json({
    status: "success",
    data: {
      customer,
    },
  });
});
