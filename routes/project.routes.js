const express = require("express");
const router = express.Router();
const projectController = require("../controllers/project.controller");
const authMiddleware = require("../middleware/auth.middleware");
const uploadMiddleware = require("../middleware/upload.middleware");

// Public routes
router.get("/", projectController.getAllProjects);
router.get("/featured", projectController.getFeaturedProjects);
router.get("/search", projectController.searchProjects);
router.get("/:id", projectController.getProjectById);
router.get("/:id/properties", projectController.getProjectProperties);

// Protected routes - require authentication
router.use(authMiddleware.protect);
router.use(authMiddleware.restrictTo("admin"));

// Admin routes
router.post(
  "/",
  uploadMiddleware.array("images", 10),
  projectController.createProject
);

router.patch(
  "/:id",
  uploadMiddleware.array("images", 10),
  projectController.updateProject
);

router.delete("/:id", projectController.deleteProject);

router.patch("/:id/featured", projectController.toggleFeaturedProject);

module.exports = router;
