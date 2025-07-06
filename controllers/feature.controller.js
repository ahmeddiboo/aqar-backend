const Feature = require("../models/Feature");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

// Get all features
exports.getAllFeatures = catchAsync(async (req, res, next) => {
  const features = await Feature.find().sort("name");

  res.status(200).json({
    status: "success",
    results: features.length,
    data: {
      features,
    },
  });
});

// Get a single feature
exports.getFeature = catchAsync(async (req, res, next) => {
  const feature = await Feature.findById(req.params.id);

  if (!feature) {
    return next(new AppError("لا توجد ميزة بهذا المعرف", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      feature,
    },
  });
});

// Create a new feature
exports.createFeature = catchAsync(async (req, res, next) => {
  // Check if a feature with the same id already exists
  const existingFeature = await Feature.findOne({ id: req.body.id });
  if (existingFeature) {
    return next(new AppError("توجد بالفعل ميزة بنفس المعرف", 400));
  }

  const feature = await Feature.create(req.body);

  res.status(201).json({
    status: "success",
    data: {
      feature,
    },
  });
});

// Update a feature
exports.updateFeature = catchAsync(async (req, res, next) => {
  const feature = await Feature.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!feature) {
    return next(new AppError("لا توجد ميزة بهذا المعرف", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      feature,
    },
  });
});

// Delete a feature
exports.deleteFeature = catchAsync(async (req, res, next) => {
  const feature = await Feature.findByIdAndDelete(req.params.id);

  if (!feature) {
    return next(new AppError("لا توجد ميزة بهذا المعرف", 404));
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});
