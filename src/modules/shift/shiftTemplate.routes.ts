import { Router } from "express";
import {
  createTemplate,
  getTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
} from "./shiftTemplate.controller";
import { verifyToken } from "../../middlewares/auth.middlewares";
import { requireRole } from "../../middlewares/roleCheck.middlewares";
import { RoleCode } from "../../constant/role";
import { validateNumericId } from "../../middlewares/validators/common.validators";

const router = Router();


router.use(verifyToken);


router.post("/", requireRole(RoleCode.ADMIN), createTemplate);
router.put(
  "/:id",
  requireRole(RoleCode.ADMIN),
  validateNumericId("id"),
  updateTemplate
);
router.delete(
  "/:id",
  requireRole(RoleCode.ADMIN),
  validateNumericId("id"),
  deleteTemplate
);


router.get("/", getTemplates);
router.get("/:id", validateNumericId("id"), getTemplateById);

export default router;
