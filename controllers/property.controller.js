const Property = require("../models/Property");
const cloudinary = require("../config/cloudinary");
const cloudinaryUpload = require("../utils/cloudinaryUpload");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const fs = require("fs");
const path = require("path");

// Get all properties with pagination and filtering
exports.getAllProperties = catchAsync(async (req, res, next) => {
  // Build query
  const queryObj = { ...req.query };
  const excludedFields = [
    "page",
    "sort",
    "limit",
    "fields",
    "includePaymentPlans",
  ];
  excludedFields.forEach((field) => delete queryObj[field]);

  // Advanced filtering
  let queryStr = JSON.stringify(queryObj);
  queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

  // Find properties with status "approved" for public requests
  const parsedQuery = JSON.parse(queryStr);

  // Add filter for properties with payment plans if requested
  if (req.query.hasPaymentPlan === "true") {
    parsedQuery.hasPaymentPlan = true;
  }

  const query = Property.find({ ...parsedQuery, status: "approved" });

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
  // Add population for project details if needed
  if (req.query.includeProjectDetails === "true") {
    query.populate({
      path: "project",
      select: "title location developer status",
    });
  }

  // Execute query
  const properties = await query;

  // Get payment plans data if requested
  let propertyPaymentPlans = {};
  if (req.query.includePaymentPlans === "true") {
    const PropertyPaymentPlan = require("../models/PropertyPaymentPlan");

    // Get all property IDs with payment plans
    const propertiesWithPlans = properties
      .filter((p) => p.hasPaymentPlan && p.project)
      .map((p) => p._id);

    if (propertiesWithPlans.length > 0) {
      // Fetch all relevant payment plans in one query
      const paymentPlans = await PropertyPaymentPlan.find({
        property: { $in: propertiesWithPlans },
      });

      // Organize payment plans by property ID
      paymentPlans.forEach((plan) => {
        const propId = plan.property.toString();
        if (!propertyPaymentPlans[propId]) {
          propertyPaymentPlans[propId] = [];
        }
        propertyPaymentPlans[propId].push(plan);
      });
    }
  }

  // Get total count for pagination
  const totalProperties = await Property.countDocuments({
    ...parsedQuery,
    status: "approved",
  });

  // Prepare response data with payment plans if requested
  const responseData = {
    properties: properties.map((prop) => {
      const property = prop.toObject();
      if (
        req.query.includePaymentPlans === "true" &&
        property.hasPaymentPlan &&
        propertyPaymentPlans[property._id]
      ) {
        property.paymentPlans = propertyPaymentPlans[property._id];
      }
      return property;
    }),
  };

  res.status(200).json({
    status: "success",
    results: properties.length,
    totalProperties,
    totalPages: Math.ceil(totalProperties / limit),
    currentPage: page,
    data: responseData,
  });
});

// Get featured properties for homepage
exports.getFeaturedProperties = catchAsync(async (req, res, next) => {
  const limit = parseInt(req.query.limit, 10) || 6;

  const featuredProperties = await Property.find({
    featured: true,
    status: "approved",
  })
    .limit(limit)
    .sort("-createdAt");

  res.status(200).json({
    status: "success",
    results: featuredProperties.length,
    data: {
      properties: featuredProperties,
    },
  });
});

// Get single property by ID
exports.getPropertyById = catchAsync(async (req, res, next) => {
  const property = await Property.findById(req.params.id)
    .populate({
      path: "createdBy",
      select: "name phone email",
    })
    .populate({
      path: "project",
      select: "title location developer status completionDate",
    });

  if (!property) {
    return next(new AppError("لا يوجد عقار بهذا الرقم التعريفي", 404));
  }

  // Get payment plans if property is part of a project and has payment plans
  let paymentPlans = [];
  if (property.project && property.hasPaymentPlan) {
    const PropertyPaymentPlan = require("../models/PropertyPaymentPlan");
    paymentPlans = await PropertyPaymentPlan.find({ property: property._id });
  }

  // Increment view count
  property.views += 1;
  await property.save({ validateBeforeSave: false });

  res.status(200).json({
    status: "success",
    data: {
      property,
      paymentPlans: paymentPlans.length > 0 ? paymentPlans : undefined,
    },
  });
});

// Search properties with advanced filtering
exports.searchProperties = catchAsync(async (req, res, next) => {
  const {
    type,
    purpose,
    minPrice,
    maxPrice,
    minArea,
    maxArea,
    rooms,
    bathrooms,
    location,
    features,
    hasPaymentPlan,
    includePaymentPlans,
    projectId,
  } = req.query;
  // Build filter object
  const filter = { status: "approved" };

  if (type) filter.type = type;
  if (purpose) filter.purpose = purpose;
  if (location) filter.location = { $regex: location, $options: "i" };
  if (hasPaymentPlan === "true") filter.hasPaymentPlan = true;
  if (projectId) filter.project = projectId;

  // Price range
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  // Area range
  if (minArea || maxArea) {
    filter.area = {};
    if (minArea) filter.area.$gte = Number(minArea);
    if (maxArea) filter.area.$lte = Number(maxArea);
  }

  // Rooms and bathrooms
  if (rooms) filter.rooms = { $gte: Number(rooms) };
  if (bathrooms) filter.bathrooms = { $gte: Number(bathrooms) };

  // Features (if provided as an array or comma-separated string)
  if (features) {
    const featureArray = Array.isArray(features)
      ? features
      : features.split(",");
    filter.features = { $all: featureArray };
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;
  // Add population for project if needed
  const query = Property.find(filter)
    .sort("-createdAt")
    .skip(skip)
    .limit(limit);

  if (filter.project || req.query.includeProjectDetails === "true") {
    query.populate({
      path: "project",
      select: "title location developer status",
    });
  }

  // Execute query
  const properties = await query;

  // Get payment plans data if requested
  let propertyPaymentPlans = {};
  if (includePaymentPlans === "true") {
    const PropertyPaymentPlan = require("../models/PropertyPaymentPlan");

    // Get all property IDs with payment plans
    const propertiesWithPlans = properties
      .filter((p) => p.hasPaymentPlan && p.project)
      .map((p) => p._id);

    if (propertiesWithPlans.length > 0) {
      // Fetch all relevant payment plans in one query
      const paymentPlans = await PropertyPaymentPlan.find({
        property: { $in: propertiesWithPlans },
      });

      // Organize payment plans by property ID
      paymentPlans.forEach((plan) => {
        const propId = plan.property.toString();
        if (!propertyPaymentPlans[propId]) {
          propertyPaymentPlans[propId] = [];
        }
        propertyPaymentPlans[propId].push(plan);
      });
    }
  }

  // Get total count for pagination
  const totalProperties = await Property.countDocuments(filter);

  // Prepare response data with payment plans if requested
  const responseData = {
    properties: properties.map((prop) => {
      const property = prop.toObject();
      if (
        includePaymentPlans === "true" &&
        property.hasPaymentPlan &&
        propertyPaymentPlans[property._id]
      ) {
        property.paymentPlans = propertyPaymentPlans[property._id];
      }
      return property;
    }),
  };

  res.status(200).json({
    status: "success",
    results: properties.length,
    totalProperties,
    totalPages: Math.ceil(totalProperties / limit),
    currentPage: page,
    data: responseData,
  });
});

// Create a new property
exports.createProperty = catchAsync(async (req, res, next) => {
  // Add the current user as the property creator
  req.body.createdBy = req.user.id;

  // If property is linked to a project, verify the project exists
  if (req.body.project) {
    const Project = require("../models/Project");
    const project = await Project.findById(req.body.project);

    if (!project) {
      return next(new AppError("المشروع المحدد غير موجود", 404));
    }
  }
  // Handle image uploads
  const imageUrls = [];
  let mainImageUrl = "";
  if (req.files && req.files.length > 0) {
    try {
      // Verify all files have valid buffers before processing
      for (const file of req.files) {
        if (!file.buffer || file.buffer.length === 0) {
          return next(new AppError("تم استلام ملف فارغ أو غير صالح", 400));
        }
      }

      // Process each file
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];

        // Generate a unique filename
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path.extname(file.originalname);
        const fileName = `property-${uniqueSuffix}`;

        // Upload to Cloudinary using the buffer
        const result = await cloudinaryUpload.uploadBuffer(
          file.buffer,
          "aqar-kam/properties",
          fileName
        );

        // Store Cloudinary URL in database
        imageUrls.push(result.secure_url);

        // First image is the main image
        if (i === 0) {
          mainImageUrl = result.secure_url;
        }
      }
    } catch (error) {
      console.error("Image upload error:", error);

      // Remove any temporary files that might have been created
      if (req.files && req.files.length > 0) {
        for (let file of req.files) {
          if (file.path && fs.existsSync(file.path)) {
            try {
              fs.unlinkSync(file.path);
            } catch (err) {
              console.error("Error deleting temporary file:", err);
            }
          }
        }
      }

      return next(
        new AppError(
          `فشل في رفع الصور، يرجى المحاولة مرة أخرى: ${error.message || ""}`,
          500
        )
      );
    }
  }

  // Add image URLs to the property data
  req.body.images = imageUrls;
  req.body.mainImage = mainImageUrl;
  // Check if property is associated with a project
  if (req.body.project) {
    // Automatically set hasPaymentPlan to true for properties in projects
    req.body.hasPaymentPlan = true;
  }

  // Create the property in database
  const newProperty = await Property.create(req.body);

  // Create default payment plan if property is part of a project
  if (newProperty.project && newProperty.hasPaymentPlan && req.body.price) {
    const PropertyPaymentPlan = require("../models/PropertyPaymentPlan");

    // Create a basic payment plan
    await PropertyPaymentPlan.create({
      property: newProperty._id,
      title: `خطة دفع ${newProperty.title}`,
      description: `خطة دفع أساسية للعقار ${newProperty.title}`,
      price: req.body.price,
      downPayment: 10, // 10% تحتاج ضبط بناءً على سياسة الشركة
      installmentPeriod: 60, // 60 شهر (5 سنوات) تحتاج ضبط بناءً على سياسة الشركة
    });
  }

  res.status(201).json({
    status: "success",
    data: {
      property: newProperty,
    },
  });
});

// Update an existing property
exports.updateProperty = catchAsync(async (req, res, next) => {
  const property = await Property.findById(req.params.id);

  if (!property) {
    return next(new AppError("لا يوجد عقار بهذا الرقم التعريفي", 404));
  }

  // Check if user is property owner or admin
  if (
    property.createdBy.toString() !== req.user.id &&
    req.user.role !== "admin"
  ) {
    return next(new AppError("غير مصرح لك بتعديل هذا العقار", 403));
  }
  // Handle new image uploads if any
  if (req.files && req.files.length > 0) {
    const imageUrls = [];

    // Process each new file
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];

      // Generate a unique filename
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = path.extname(file.originalname);
      const fileName = `property-${uniqueSuffix}`;

      // Upload to Cloudinary using the buffer
      const result = await cloudinaryUpload.uploadBuffer(
        file.buffer,
        "aqar-kam/properties",
        fileName
      );

      // Store Cloudinary URL
      imageUrls.push(result.secure_url);
    }

    // Handle existing images if provided in the request body
    const existingImages = req.body.existingImages
      ? typeof req.body.existingImages === "string"
        ? JSON.parse(req.body.existingImages)
        : req.body.existingImages
      : [];

    // Combine existing images with new uploads
    req.body.images = [...existingImages, ...imageUrls];

    // Update main image if needed
    if (!req.body.mainImage && req.body.images.length > 0) {
      req.body.mainImage = req.body.images[0];
    }
  }
  // Check if property is associated with a project
  if (req.body.project) {
    // Automatically set hasPaymentPlan to true for properties in projects
    req.body.hasPaymentPlan = true;
  }

  // Update property in database
  const updatedProperty = await Property.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );

  // Handle payment plans if property is part of a project
  if (
    updatedProperty.project &&
    updatedProperty.hasPaymentPlan &&
    req.body.price
  ) {
    const PropertyPaymentPlan = require("../models/PropertyPaymentPlan");

    // Check if property already has a payment plan
    const existingPaymentPlan = await PropertyPaymentPlan.findOne({
      property: updatedProperty._id,
    });

    if (existingPaymentPlan) {
      // Update existing payment plan with new price if needed
      if (existingPaymentPlan.price !== req.body.price) {
        existingPaymentPlan.price = req.body.price;
        await existingPaymentPlan.save();
      }
    } else {
      // Create new payment plan
      await PropertyPaymentPlan.create({
        property: updatedProperty._id,
        title: `خطة دفع ${updatedProperty.title}`,
        description: `خطة دفع أساسية للعقار ${updatedProperty.title}`,
        price: req.body.price,
        downPayment: 10, // 10% تحتاج ضبط بناءً على سياسة الشركة
        installmentPeriod: 60, // 60 شهر (5 سنوات) تحتاج ضبط بناءً على سياسة الشركة
      });
    }
  }

  res.status(200).json({
    status: "success",
    data: {
      property: updatedProperty,
    },
  });
});

// Delete a property
exports.deleteProperty = catchAsync(async (req, res, next) => {
  const property = await Property.findById(req.params.id);

  if (!property) {
    return next(new AppError("لا يوجد عقار بهذا الرقم التعريفي", 404));
  }

  // Check if user is property owner or admin
  if (
    property.createdBy.toString() !== req.user.id &&
    req.user.role !== "admin"
  ) {
    return next(new AppError("غير مصرح لك بحذف هذا العقار", 403));
  }
  // Delete property images from Cloudinary
  if (property.images && property.images.length > 0) {
    try {
      for (const imageUrl of property.images) {
        // Extract public ID from Cloudinary URL
        const publicId = cloudinaryUpload.getPublicIdFromUrl(imageUrl);
        if (publicId) {
          // Delete image from Cloudinary
          await cloudinaryUpload.deleteImage(publicId);
        }
      }
    } catch (error) {
      console.error("Error deleting images from Cloudinary:", error);
      // Continue with property deletion even if image deletion fails
    }
  }
  // Delete any associated payment plans
  if (property.hasPaymentPlan) {
    const PropertyPaymentPlan = require("../models/PropertyPaymentPlan");
    await PropertyPaymentPlan.deleteMany({ property: property._id });
  }

  // Delete the property
  await Property.findByIdAndDelete(req.params.id);

  res.status(204).json({
    status: "success",
    data: null,
  });
});

// Admin: Update property status (approve/reject)
exports.updatePropertyStatus = catchAsync(async (req, res, next) => {
  const { status } = req.body;

  if (!["pending", "approved", "rejected"].includes(status)) {
    return next(new AppError("حالة العقار غير صالحة", 400));
  }

  const property = await Property.findByIdAndUpdate(
    req.params.id,
    { status },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!property) {
    return next(new AppError("لا يوجد عقار بهذا الرقم التعريفي", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      property,
    },
  });
});

// Admin: Toggle featured property
exports.toggleFeaturedProperty = catchAsync(async (req, res, next) => {
  const property = await Property.findById(req.params.id);

  if (!property) {
    return next(new AppError("لا يوجد عقار بهذا الرقم التعريفي", 404));
  }

  property.featured = !property.featured;
  await property.save();

  res.status(200).json({
    status: "success",
    data: {
      property,
    },
  });
});
