import { RequestHandler, Router } from "express";
import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../core/types/auth.types";
import { validateRequest } from "../middleware/validation.middleware";
import { UserRepository } from "../../data/repositories/user.repository";
import { AuthService } from "../../core/services/auth.service";
import { authMiddleware } from "../middleware/auth.middleware";
import { body } from "express-validator";
import { ConflictError, UnauthorizedError } from "../../common/errors/AppError";

export const createUserRouter = (
  userRepo: UserRepository,
  authService: AuthService
) => {
  const router = Router();

  router.use(authMiddleware(userRepo));

  // GET /api/user - Get current user profile
  router.get(
    "/",
    (async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const user = await userRepo.findById(req.user.id);
        res.json(user);
      } catch (error) {
        next(error);
      }
    }) as RequestHandler
  );

  // PUT /api/user/email - Update email
  router.put(
    "/email",
    [body("email").isEmail().withMessage("Valid email is required")],
    validateRequest(),
    (async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const existing = await userRepo.findByEmail(req.body.email);
        if (existing && existing.id !== req.user.id) {
          throw new ConflictError("Email already taken");
        }
        const updated = await userRepo.updateEmail(req.user.id, req.body.email);
        res.json(updated);
      } catch (error) {
        next(error);
      }
    }) as RequestHandler
  );

  // PUT /api/user/username - Update username
  router.put(
    "/username",
    [
      body("username")
        .trim()
        .isLength({ min: 4, max: 24 })
        .matches(/^[A-Za-z][A-Za-z0-9-_]{3,23}$/)
        .withMessage(
          "Username must be 4-24 characters, start with a letter, and contain only letters, numbers, hyphens, or underscores"
        ),
    ],
    validateRequest(),
    (async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const existing = await userRepo.findByUsername(req.body.username);
        if (existing && existing.id !== req.user.id) {
          throw new ConflictError("Username already taken");
        }
        const updated = await userRepo.updateUsername(
          req.user.id,
          req.body.username
        );
        res.json(updated);
      } catch (error) {
        next(error);
      }
    }) as RequestHandler
  );

  // PUT /api/user/password - Update password
  router.put(
    "/password",
    [
      body("currentPassword").notEmpty().withMessage("Current password is required"),
      body("newPassword")
        .isLength({ min: 8, max: 24 })
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%]).{8,24}$/)
        .withMessage(
          "Password must be 8-24 characters with uppercase, lowercase, number, and special character (!@#$%)"
        ),
    ],
    validateRequest(),
    (async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const { currentPassword, newPassword } = req.body;

        const storedPassword = await userRepo.getPassword(req.user.id);
        if (!storedPassword) {
          throw new UnauthorizedError("Invalid credentials");
        }

        const isValid = await authService.verifyPassword(
          currentPassword,
          storedPassword
        );
        if (!isValid) {
          throw new UnauthorizedError("Current password is incorrect");
        }

        const { hash } = await import("bcryptjs");
        const hashedPassword = await hash(newPassword, 10);
        await userRepo.updatePassword(req.user.id, hashedPassword);

        res.json({ success: true, message: "Password updated successfully" });
      } catch (error) {
        next(error);
      }
    }) as RequestHandler
  );

  return router;
};
