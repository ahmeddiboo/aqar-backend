const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");
const authMiddleware = require("../middleware/auth.middleware");

// Protect all admin routes with authentication
router.use(authMiddleware.protect);
router.use(authMiddleware.restrictTo("admin"));

// Dashboard stats
router.get("/dashboard", adminController.getDashboardStats);

// Properties for admin (all statuses)
router.get("/properties", adminController.getAllProperties);
router.get("/properties/:id", adminController.getPropertyById);
router.put("/properties/:id", adminController.updateProperty);

// Users management
router.get("/users", adminController.getAllUsers);
router.get("/users/:id", adminController.getUserById);
router.put("/users/:id", adminController.updateUser);
router.delete("/users/:id", adminController.deleteUser);

// Messages - for convenience, we'll also include a route to get messages from the admin routes
const messageController = require("../controllers/message.controller");
router.get("/messages", messageController.getAllMessages);

// Projects management
const projectController = require("../controllers/project.controller");
router.get("/projects", projectController.getAllProjects);
router.get("/projects/:id", projectController.getProjectById);
router.put("/projects/:id", projectController.updateProject);

// Customers management
const customerController = require("../controllers/customer.controller");
router.get("/customers", customerController.getAllCustomers);
router.get("/customers/:id", customerController.getCustomerById);

module.exports = router;
