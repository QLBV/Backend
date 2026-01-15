import { Router } from "express";
import * as EmployeeController from "./employee.controller";
import { verifyToken } from "../../middlewares/auth.middlewares";
import { requireRole } from "../../middlewares/roleCheck.middlewares";
import { RoleCode } from "../../constant/role";
import { uploadEmployeeAvatar } from "../../middlewares/uploadEmployeeAvatar.middlewares";

const router = Router();

router.use(verifyToken);
router.use(requireRole(RoleCode.ADMIN));

router.get("/", EmployeeController.getAllEmployees);
router.get("/:id", EmployeeController.getEmployeeById);
router.put("/:id", EmployeeController.updateEmployee);
router.delete("/:id", EmployeeController.deleteEmployee);
router.put("/:id/avatar", uploadEmployeeAvatar.single("avatar"), EmployeeController.uploadAvatar);

export default router;
