import { sign, verify } from "jsonwebtoken";
import { hash, compare } from "bcryptjs";
import { JWTPayload, TokenPair } from "../types/auth.types";
import { UserRepository } from "../../data/repositories/user.repository";
import {
  ConflictError,
  InternalServerError,
  InvalidTokenError,
  NotFoundError,
  UnauthorizedError,
} from "../../common/errors/AppError";
import { env } from "../../common/config/env.config";

export class AuthService {
  constructor(private userRepo: UserRepository) {}

  async register(username: string, email: string, password: string) {
    const userNameExists = await this.userRepo.findByUsername(username);
    const emailExists = await this.userRepo.findByEmail(email);

    if (userNameExists) {
      throw new ConflictError("Username already exists.");
    } else if (emailExists) {
      throw new ConflictError("Email already exists.");
    }

    const passwordHash = await hash(password, 10);
    const user = await this.userRepo.create({ username, email }, passwordHash);

    const tokenPair = await this.generateTokenPair(user.id);

    return { user, tokenPair };
  }

  async login(username: string, password: string) {
    const user = await this.userRepo.findByUsername(username);

    if (!user) {
      throw new UnauthorizedError("Invalid credentials.");
    }

    const hashedPassword = await this.userRepo.getPassword(user.id);

    if (!hashedPassword) {
      throw new UnauthorizedError("Invalid credentials.");
    } else {
      const passwordIsValid = await this.verifyPassword(
        password,
        hashedPassword
      );
      if (!passwordIsValid) {
        throw new UnauthorizedError("Invalid credentials.");
      }
    }

    await this.userRepo.updateLastLogin(user.id);
    const tokenPair = await this.generateTokenPair(user.id);
    return { user, tokenPair };
  }
  async logout() {}
  async verifyPassword(
    password: string,
    hashedPassword: string
  ): Promise<boolean> {
    return await compare(password, hashedPassword);
  }

  async refreshToken(refreshToken: string): Promise<TokenPair> {
    try {
      const payload = verify(refreshToken, env.REFRESH_TOKEN_SECRET) as JWTPayload;
      if (payload.type !== "refresh") {
        throw new InvalidTokenError();
      }

      const user = await this.userRepo.findById(payload.sub);
      if (!user) {
        throw new InvalidTokenError();
      }

      return this.generateTokenPair(user.id);
    } catch (error) {
      throw new InvalidTokenError();
    }
  }

  private generateTokenPair(userId: string): TokenPair {
    try {
      const accessToken = sign(
        { sub: userId, type: "access" },
        env.ACCESS_TOKEN_SECRET,
        { expiresIn: "15m" }
      );

      const refreshToken = sign(
        { sub: userId, type: "refresh" },
        env.REFRESH_TOKEN_SECRET,
        { expiresIn: "7d" }
      );

      return {
        accessToken,
        refreshToken,
        expiresIn: 900,
      };
    } catch (error) {
      throw new InternalServerError("Failed to generate token pair.");
    }
  }
}
