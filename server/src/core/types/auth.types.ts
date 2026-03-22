import { User } from "./user.types";
import { Request } from "express";

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface JWTPayload {
  sub: string;
  type: TokenType;
  iat: number;
  exp: number;
}

export type TokenType = "access" | "refresh";

export interface AuthenticatedRequest extends Request {
  user: User;
}
