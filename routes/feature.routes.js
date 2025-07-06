const express = require("express");
const router = express.Router();
const featureController = require("../controllers/feature.controller");
const authMiddleware = require("../middleware/auth.middleware");

// Public route - Get all features
router.get("/", featureController.getAllFeatures);

// Admin routes - require authentication and admin privileges
router.use(authMiddleware.protect);
router.use(authMiddleware.restrictTo("admin"));

router.post("/", featureController.createFeature);
router.get("/:id", featureController.getFeature);
router.patch("/:id", featureController.updateFeature);
router.delete("/:id", featureController.deleteFeature);

module.exports = router;
