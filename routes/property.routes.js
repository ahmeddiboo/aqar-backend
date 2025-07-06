const express = require("express");
const router = express.Router();
const propertyController = require("../controllers/property.controller");
const authMiddleware = require("../middleware/auth.middleware");
const uploadMiddleware = require("../middleware/upload.middleware");

// Importar las rutas de planes de pago
const propertyPaymentPlanRoutes = require("./propertyPaymentPlan.routes");

// Re-route to payment plan routes
router.use("/:propertyId/payment-plans", propertyPaymentPlanRoutes);

// Public routes
router.get("/", propertyController.getAllProperties);
router.get("/featured", propertyController.getFeaturedProperties);
router.get("/:id", propertyController.getPropertyById);
router.get("/search", propertyController.searchProperties);

// Protected routes - require authentication
router.post(
  "/",
  authMiddleware.protect,
  uploadMiddleware.array("images", 10),
  propertyController.createProperty
);

router.patch(
  "/:id",
  authMiddleware.protect,
  authMiddleware.restrictTo("admin", "owner"),
  uploadMiddleware.array("images", 10),
  propertyController.updateProperty
);

router.delete(
  "/:id",
  authMiddleware.protect,
  authMiddleware.restrictTo("admin", "owner"),
  propertyController.deleteProperty
);

// Admin routes
router.patch(
  "/:id/status",
  authMiddleware.protect,
  authMiddleware.restrictTo("admin"),
  propertyController.updatePropertyStatus
);

router.patch(
  "/:id/featured",
  authMiddleware.protect,
  authMiddleware.restrictTo("admin"),
  propertyController.toggleFeaturedProperty
);

module.exports = router;
