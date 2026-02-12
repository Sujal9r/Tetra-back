import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  authorizePermissions,
  authorizeAnyPermissions,
} from "../middlewares/permissionMiddleware.js";
import { PERMISSIONS } from "../utils/roles.js";

import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserAttendance,
  getAllUsersAttendance,
} from "../controllers/adminController.js";

const router = express.Router();

router.use(protect);

// User management
router.get(
  "/users",
  authorizeAnyPermissions(PERMISSIONS.VIEW_ADMIN_USERS, PERMISSIONS.VIEW_EMPLOYEES),
  getAllUsers
);
router.get(
  "/users/:id",
  authorizeAnyPermissions(PERMISSIONS.VIEW_ADMIN_USERS, PERMISSIONS.VIEW_EMPLOYEES),
  getUserById
);
router.post(
  "/users",
  authorizeAnyPermissions(PERMISSIONS.MANAGE_USERS, PERMISSIONS.CREATE_EMPLOYEE),
  createUser
);
router.put(
  "/users/:id",
  authorizeAnyPermissions(
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.EDIT_EMPLOYEE,
    PERMISSIONS.TOGGLE_EMPLOYEE_STATUS,
  ),
  updateUser
);
router.delete(
  "/users/:id",
  authorizeAnyPermissions(PERMISSIONS.MANAGE_USERS, PERMISSIONS.DELETE_EMPLOYEE),
  deleteUser
);

// Attendance
router.get(
  "/attendance",
  authorizePermissions(PERMISSIONS.VIEW_ADMIN_ATTENDANCE),
  getAllUsersAttendance
);
router.get(
  "/attendance/:id",
  authorizePermissions(PERMISSIONS.VIEW_ADMIN_ATTENDANCE),
  getUserAttendance
);

export default router;
