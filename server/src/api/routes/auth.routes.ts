import { Router } from "express";
import { AuthService } from "../../core/services/auth.service";
import { body } from "express-validator";
import { Request, Response, NextFunction } from "express";
import { validateRequest } from "../middleware/validation.middleware";

export const createAuthRouter = (authService: AuthService) => {
  const router = Router();

  router.post(
    "/register",
    [
      body("username").trim().isLength({ min: 3, max: 20 }),
      body("email").optional().isEmail(),
      body("password").isLength({ min: 8 }),
    ],
    validateRequest(),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { user, tokenPair } = await authService.register(
          req.body.username,
          req.body.email,
          req.body.password
        );
        res.status(201).json({
          succes: true,
          user,
          ...tokenPair,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  router.post(
    "/login",
    [body("username").trim().notEmpty(), body("password").notEmpty()],
    validateRequest(),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { user, tokenPair } = await authService.login(
          req.body.username,
          req.body.password
        );
        res.status(200).json({
          success: true,
          user,
          ...tokenPair,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  router.post(
    "/refresh",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { refreshToken } = req.body;
        const tokens = await authService.refreshToken(refreshToken);
        res.status(200).json({
          success: true,
          ...tokens,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
};
