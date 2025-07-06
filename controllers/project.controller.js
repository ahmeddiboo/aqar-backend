const Project = require("../models/Project");
const cloudinary = require("../config/cloudinary");
const cloudinaryUpload = require("../utils/cloudinaryUpload");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const fs = require("fs");
const path = require("path");

// Get all projects with pagination and filtering
exports.getAllProjects = catchAsync(async (req, res, next) => {
  // Build query
  const queryObj = { ...req.query };
  const excludedFields = ["page", "sort", "limit", "fields"];
  excludedFields.forEach((field) => delete queryObj[field]);

  // Advanced filtering
  let queryStr = JSON.stringify(queryObj);
  queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

  // Find projects
  const query = Project.find(JSON.parse(queryStr));

  // Sorting
  if (req.query.sort) {
    const sortBy = req.query.sort.split(",").join(" ");
    query.sort(sortBy);
  } else {
    query.sort("-createdAt");
  }

  // Field limiting
  if (req.query.fields) {
    const fields = req.query.fields.split(",").join(" ");
    query.select(fields);
  } else {
    query.select("-__v");
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  query.skip(skip).limit(limit);

  // Execute query
  const projects = await query;

  // Get the Property model
  const Property = require("../models/Property");

  // Get the count of properties for each project
  const projectsWithPropertyCount = await Promise.all(
    projects.map(async (project) => {
      const propertyCount = await Property.countDocuments({
        project: project._id,
      });
      const projectObj = project.toObject();
      projectObj.propertyCount = propertyCount;

      // If availableUnits is not set explicitly, use the property count
      if (projectObj.availableUnits === 0 && projectObj.units > 0) {
        projectObj.availableUnits = projectObj.units - propertyCount;
        if (projectObj.availableUnits < 0) projectObj.availableUnits = 0;
      }

      return projectObj;
    })
  );

  // Get total count for pagination
  const totalProjects = await Project.countDocuments(JSON.parse(queryStr));

  res.status(200).json({
    status: "success",
    results: projectsWithPropertyCount.length,
    totalProjects,
    totalPages: Math.ceil(totalProjects / limit),
    currentPage: page,
    data: {
      projects: projectsWithPropertyCount,
    },
  });
});

// Get featured projects
exports.getFeaturedProjects = catchAsync(async (req, res, next) => {
  const projects = await Project.find({ featured: true }).limit(6);

  // Get the Property model
  const Property = require("../models/Property");

  // Get the count of properties for each project
  const projectsWithPropertyCount = await Promise.all(
    projects.map(async (project) => {
      const propertyCount = await Property.countDocuments({
        project: project._id,
      });
      const projectObj = project.toObject();
      projectObj.propertyCount = propertyCount;

      // If availableUnits is not set explicitly, use the property count
      if (projectObj.availableUnits === 0 && projectObj.units > 0) {
        projectObj.availableUnits = projectObj.units - propertyCount;
        if (projectObj.availableUnits < 0) projectObj.availableUnits = 0;
      }

      return projectObj;
    })
  );

  res.status(200).json({
    status: "success",
    results: projectsWithPropertyCount.length,
    data: {
      projects: projectsWithPropertyCount,
    },
  });
});

// Get a single project by ID
exports.getProjectById = catchAsync(async (req, res, next) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    return next(new AppError("لا يوجد مشروع بهذا المعرف", 404));
  }

  // Get the Property model to fetch related properties
  const Property = require("../models/Property");

  // Get the count and list of properties for this project
  const propertyCount = await Property.countDocuments({ project: project._id });
  let relatedProperties = [];

  // Only fetch related properties if the includeProperties query param is present
  if (req.query.includeProperties) {
    relatedProperties = await Property.find({ project: project._id })
      .select("title price location type purpose area mainImage")
      .limit(10);
  }

  const projectObj = project.toObject();
  projectObj.propertyCount = propertyCount;

  // If availableUnits is not set explicitly, calculate it
  if (projectObj.availableUnits === 0 && projectObj.units > 0) {
    projectObj.availableUnits = projectObj.units - propertyCount;
    if (projectObj.availableUnits < 0) projectObj.availableUnits = 0;
  }

  // Add related properties if requested
  if (req.query.includeProperties) {
    projectObj.properties = relatedProperties;
  }

  res.status(200).json({
    status: "success",
    data: {
      project: projectObj,
    },
  });
});

// Create a new project
exports.createProject = catchAsync(async (req, res, next) => {
  const projectData = { ...req.body };
  let uploadedImages = [];

  // Handle image uploads if files are provided
  if (req.files && req.files.length > 0) {
    // Upload each image to cloudinary
    for (const file of req.files) {
      try {
        // Upload to cloudinary using the correct uploadBuffer method
        const result = await cloudinaryUpload.uploadBuffer(
          file.buffer,
          "projects"
        );
        uploadedImages.push(result.secure_url);

        // No need to delete local files when using memory storage
      } catch (error) {
        console.error("Image upload error:", error);
        // No cleanup needed when using memory storage
        return next(
          new AppError(
            `فشل في رفع الصور: ${error.message || "خطأ غير متوقع"}`,
            500
          )
        );
      }
    }
  }

  // Add images to project data
  if (uploadedImages.length > 0) {
    projectData.images = uploadedImages;
    // Set main image to the first uploaded image
    projectData.mainImage = uploadedImages[0];
  }

  // Parse paymentPlans if it's sent as a JSON string
  if (
    projectData.paymentPlans &&
    typeof projectData.paymentPlans === "string"
  ) {
    try {
      projectData.paymentPlans = JSON.parse(projectData.paymentPlans);
    } catch (error) {
      return next(new AppError("خطأ في تنسيق خطط الدفع", 400));
    }
  }

  // Create project
  const project = await Project.create(projectData);

  res.status(201).json({
    status: "success",
    data: {
      project,
    },
  });
});

// Update a project
exports.updateProject = catchAsync(async (req, res, next) => {
  const projectData = { ...req.body };
  let uploadedImages = [];

  // Find the project first
  const project = await Project.findById(req.params.id);

  if (!project) {
    return next(new AppError("لا يوجد مشروع بهذا المعرف", 404));
  }

  // Parse paymentPlans if it's sent as a JSON string
  if (
    projectData.paymentPlans &&
    typeof projectData.paymentPlans === "string"
  ) {
    try {
      projectData.paymentPlans = JSON.parse(projectData.paymentPlans);
    } catch (error) {
      return next(new AppError("خطأ في تنسيق خطط الدفع", 400));
    }
  }
  // Handle image uploads if files are provided
  if (req.files && req.files.length > 0) {
    // Upload each image to cloudinary
    for (const file of req.files) {
      try {
        // Upload to cloudinary using uploadBuffer method
        const result = await cloudinaryUpload.uploadBuffer(
          file.buffer,
          "projects"
        );
        uploadedImages.push(result.secure_url);

        // No need to delete local files when using memory storage
      } catch (error) {
        console.error("Image upload error:", error);
        // No cleanup needed when using memory storage
        return next(
          new AppError(
            `فشل في رفع الصور: ${error.message || "خطأ غير متوقع"}`,
            500
          )
        );
        return next(
          new AppError(
            `فشل في رفع الصور: ${error.message || "خطأ غير متوقع"}`,
            500
          )
        );
      }
    }

    // Add new images to existing images
    if (uploadedImages.length > 0) {
      projectData.images = [...(project.images || []), ...uploadedImages];

      // Set main image if not already set
      if (!project.mainImage) {
        projectData.mainImage = uploadedImages[0];
      }
    }
  }

  // Update the project
  const updatedProject = await Project.findByIdAndUpdate(
    req.params.id,
    projectData,
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    status: "success",
    data: {
      project: updatedProject,
    },
  });
});

// Delete a project
exports.deleteProject = catchAsync(async (req, res, next) => {
  const project = await Project.findByIdAndDelete(req.params.id);

  if (!project) {
    return next(new AppError("لا يوجد مشروع بهذا المعرف", 404));
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});

// Toggle featured status
exports.toggleFeaturedProject = catchAsync(async (req, res, next) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    return next(new AppError("لا يوجد مشروع بهذا المعرف", 404));
  }

  project.featured = !project.featured;
  await project.save();

  res.status(200).json({
    status: "success",
    data: {
      project,
    },
  });
});

// Search for projects
exports.searchProjects = catchAsync(async (req, res, next) => {
  const { query } = req.query;

  if (!query) {
    return next(new AppError("يرجى توفير كلمة بحث", 400));
  }

  const projects = await Project.find({
    $or: [
      { title: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } },
      { location: { $regex: query, $options: "i" } },
    ],
  }).limit(10);

  res.status(200).json({
    status: "success",
    results: projects.length,
    data: {
      projects,
    },
  });
});

// Get all properties in a project
exports.getProjectProperties = catchAsync(async (req, res, next) => {
  const projectId = req.params.id;

  // Check if project exists
  const project = await Project.findById(projectId);
  if (!project) {
    return next(new AppError("لا يوجد مشروع بهذا المعرف", 404));
  }

  // Get the Property model
  const Property = require("../models/Property");

  // Build query
  const queryObj = { ...req.query, project: projectId };
  const excludedFields = ["page", "sort", "limit", "fields"];
  excludedFields.forEach((field) => delete queryObj[field]);

  // Advanced filtering
  let queryStr = JSON.stringify(queryObj);
  queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

  // Find properties in this project
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
      project: {
        _id: project._id,
        title: project.title,
      },
      properties,
    },
  });
});
