const PropertyPaymentPlan = require("../models/PropertyPaymentPlan");
const Property = require("../models/Property");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

// Get all payment plans for a property
exports.getAllPropertyPaymentPlans = catchAsync(async (req, res, next) => {
  const { propertyId } = req.params;

  // Verify property exists
  const property = await Property.findById(propertyId);
  if (!property) {
    return next(new AppError("لا توجد وحدة بهذا المعرف", 404));
  }

  const paymentPlans = await PropertyPaymentPlan.find({ property: propertyId });

  res.status(200).json({
    status: "success",
    results: paymentPlans.length,
    data: {
      paymentPlans,
    },
  });
});

// Get a specific payment plan
exports.getPropertyPaymentPlan = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const paymentPlan = await PropertyPaymentPlan.findById(id);

  if (!paymentPlan) {
    return next(new AppError("لا توجد خطة دفع بهذا المعرف", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      paymentPlan,
    },
  });
});

// Create a new payment plan for a property
exports.createPropertyPaymentPlan = catchAsync(async (req, res, next) => {
  const { propertyId } = req.params;

  // Verify property exists
  const property = await Property.findById(propertyId);
  if (!property) {
    return next(new AppError("لا توجد وحدة بهذا المعرف", 404));
  }

  // Add property ID to the payment plan data
  req.body.property = propertyId;

  // Create the payment plan
  const newPaymentPlan = await PropertyPaymentPlan.create(req.body);

  res.status(201).json({
    status: "success",
    data: {
      paymentPlan: newPaymentPlan,
    },
  });
});

// Update a payment plan
exports.updatePropertyPaymentPlan = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const paymentPlan = await PropertyPaymentPlan.findByIdAndUpdate(
    id,
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!paymentPlan) {
    return next(new AppError("لا توجد خطة دفع بهذا المعرف", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      paymentPlan,
    },
  });
});

// Delete a payment plan
exports.deletePropertyPaymentPlan = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const paymentPlan = await PropertyPaymentPlan.findByIdAndDelete(id);

  if (!paymentPlan) {
    return next(new AppError("لا توجد خطة دفع بهذا المعرف", 404));
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});
