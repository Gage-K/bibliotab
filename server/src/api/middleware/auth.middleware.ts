import { NextFunction, Request, Response } from "express";
import { UserRepository } from "../../data/repositories/user.repository";
import {
  AppError,
  InternalServerError,
  InvalidTokenError,
} from "../../common/errors/AppError";
import { AuthenticatedRequest, JWTPayload } from "../../core/types/auth.types";
import { verify } from "jsonwebtoken";
import { env } from "../../common/config/env.config";

export const authMiddleware = (userRepo: UserRepository) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader?.startsWith("Bearer ")) {
        throw new InvalidTokenError();
      }

      const token = authHeader.split(" ")[1];

      const payload = verify(token, env.ACCESS_TOKEN_SECRET) as JWTPayload;

      if (payload.type !== "access") {
        throw new InvalidTokenError();
      }

      const user = await userRepo.findById(payload.sub);

      if (!user) {
        throw new InvalidTokenError();
      }

      (req as AuthenticatedRequest).user = user;

      next();
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else {
        next(new InvalidTokenError());
      }
    }
  };
};
