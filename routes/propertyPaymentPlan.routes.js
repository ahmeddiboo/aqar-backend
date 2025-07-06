const express = require("express");
const router = express.Router({ mergeParams: true });
const propertyPaymentPlanController = require("../controllers/propertyPaymentPlan.controller");
const authMiddleware = require("../middleware/auth.middleware");

// Protect all routes - require authentication
router.use(authMiddleware.protect);

// Public route for getting payment plans for a property
router.get("/", propertyPaymentPlanController.getAllPropertyPaymentPlans);

// Admin only routes
router.use(authMiddleware.restrictTo("admin"));

router.post("/", propertyPaymentPlanController.createPropertyPaymentPlan);
router.get("/:id", propertyPaymentPlanController.getPropertyPaymentPlan);
router.patch("/:id", propertyPaymentPlanController.updatePropertyPaymentPlan);
router.delete("/:id", propertyPaymentPlanController.deletePropertyPaymentPlan);

module.exports = router;
