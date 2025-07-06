const AreaRate = require("../models/AreaRate");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

// الحصول على جميع أسعار المناطق
exports.getAllAreaRates = catchAsync(async (req, res, next) => {
  const areaRates = await AreaRate.find().sort("name");

  res.status(200).json({
    status: "success",
    results: areaRates.length,
    data: {
      areaRates,
    },
  });
});

// الحصول على سعر منطقة محددة بالمعرف
exports.getAreaRateById = catchAsync(async (req, res, next) => {
  const areaRate = await AreaRate.findById(req.params.id);

  if (!areaRate) {
    return next(new AppError("لا توجد منطقة بهذا المعرف", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      areaRate,
    },
  });
});

// إنشاء منطقة جديدة
exports.createAreaRate = catchAsync(async (req, res, next) => {
  // التحقق من وجود اسم المنطقة بالفعل
  const existingArea = await AreaRate.findOne({ name: req.body.name });
  if (existingArea) {
    return next(new AppError("هذه المنطقة موجودة بالفعل", 400));
  }

  const newAreaRate = await AreaRate.create(req.body);

  res.status(201).json({
    status: "success",
    data: {
      areaRate: newAreaRate,
    },
  });
});

// تحديث منطقة موجودة
exports.updateAreaRate = catchAsync(async (req, res, next) => {
  // التحقق من عدم وجود منطقة أخرى بنفس الاسم الجديد
  if (req.body.name) {
    const existingArea = await AreaRate.findOne({
      name: req.body.name,
      _id: { $ne: req.params.id },
    });
    if (existingArea) {
      return next(new AppError("هذه المنطقة موجودة بالفعل", 400));
    }
  }

  const areaRate = await AreaRate.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!areaRate) {
    return next(new AppError("لا توجد منطقة بهذا المعرف", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      areaRate,
    },
  });
});

// حذف منطقة
exports.deleteAreaRate = catchAsync(async (req, res, next) => {
  const areaRate = await AreaRate.findByIdAndDelete(req.params.id);

  if (!areaRate) {
    return next(new AppError("لا توجد منطقة بهذا المعرف", 404));
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});
