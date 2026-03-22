import { RequestHandler, Router } from "express";
import { TabService } from "../../core/services/tab.service";
import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../core/types/auth.types";
import { validateRequest } from "../middleware/validation.middleware";
import { UserRepository } from "../../data/repositories/user.repository";
import { authMiddleware } from "../middleware/auth.middleware";
import { body, param, query } from "express-validator";

export const createTabRouter = (
  tabService: TabService,
  userRepo: UserRepository
) => {
  const router = Router();

  // Apply auth middleware to all routes
  router.use(authMiddleware(userRepo));

  // GET all user's tabs with pagination
  router.get(
    "/",
    [
      query("page").optional().isInt({ min: 1 }).toInt(),
      query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
    ],
    validateRequest(),
    (async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
        const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

        const result = await tabService.getUserTabsPaginated(req.user.id, page, limit);
        res.json({
          success: true,
          data: result.tabs,
          pagination: {
            total: result.total,
            page: result.page,
            limit: result.limit,
            totalPages: result.totalPages,
          }
        });
      } catch (error) {
        next(error);
      }
    }) as RequestHandler
  );

  // POST - Create new tab
  router.post(
    "/",
    [
      body("tab_name").trim().isLength({ min: 1, max: 255 }),
      body("tab_artist").optional().trim().isLength({ max: 255 }),
      body("tuning").isArray(),
      body("tab_data").isArray(),
    ],
    validateRequest(),
    (async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const newTab = await tabService.createTab(req.body, req.user.id);
        res.status(201).json({ success: true, data: newTab });
      } catch (error) {
        next(error);
      }
    }) as RequestHandler
  );

  // GET - Get single tab by ID
  router.get(
    "/:tabId",
    [param("tabId").isUUID()],
    validateRequest(),
    (async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const tabId = Array.isArray(req.params.tabId) ? req.params.tabId[0] : req.params.tabId;
        const tab = await tabService.getTab(tabId, req.user.id);
        res.json({ success: true, data: tab });
      } catch (error) {
        next(error);
      }
    }) as RequestHandler
  );

  // PUT - Update tab
  router.put(
    "/:tabId",
    [
      param("tabId").isUUID(),
      body("tab_name").optional().trim().isLength({ min: 1, max: 255 }),
      body("tab_artist").optional().trim().isLength({ max: 255 }),
      body("tuning").optional().isArray(),
      body("tab_data").optional().isArray(),
    ],
    validateRequest(),
    (async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const tabId = Array.isArray(req.params.tabId) ? req.params.tabId[0] : req.params.tabId;
        const updated = await tabService.updateTab(
          tabId,
          req.body,
          req.user.id
        );
        res.json({ success: true, data: updated });
      } catch (error) {
        next(error);
      }
    }) as RequestHandler
  );

  // DELETE - Delete tab
  router.delete(
    "/:tabId",
    [param("tabId").isUUID()],
    validateRequest(),
    (async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const tabId = Array.isArray(req.params.tabId) ? req.params.tabId[0] : req.params.tabId;
        await tabService.deleteTab(tabId, req.user.id);
        res.json({ success: true, message: "Tab deleted successfully" });
      } catch (error) {
        next(error);
      }
    }) as RequestHandler
  );

  return router;
};
