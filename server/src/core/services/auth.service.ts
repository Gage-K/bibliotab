import { sign, verify } from "jsonwebtoken";
import { hash, compare } from "bcryptjs";

export class AuthService {
  async login(username: string, password: string) {}
  async logout() {}
  async register() {}
  async refresh() {}
  async verify() {}

  private generateAccessToken() {}
  private generateRefreshToken() {}
}
