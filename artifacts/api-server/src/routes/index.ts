import { Router, type IRouter } from "express";
import { requireAuth } from "../middleware/requireAuth";
import authRouter from "./auth";
import healthRouter from "./health";
import departmentsRouter from "./departments";
import usersRouter from "./users";
import rolesRouter from "./roles";
import dashboardRouter from "./dashboard";
import documentsRouter from "./documents";

const router: IRouter = Router();

// Public routes
router.use(authRouter);
router.use(healthRouter);

// Protected routes — require a valid session
router.use(requireAuth);
router.use(departmentsRouter);
router.use(usersRouter);
router.use(rolesRouter);
router.use(dashboardRouter);
router.use(documentsRouter);

export default router;
