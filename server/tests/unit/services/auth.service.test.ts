import { describe, it, expect, beforeEach, vi } from "vitest";
import { AuthService } from "../../../src/core/services/auth.service";
import { UserRepository } from "../../../src/data/repositories/user.repository";
import { sign } from "jsonwebtoken";
import bcrypt from "bcryptjs";

vi.mock("bcryptjs");
vi.mock("jsonwebtoken", () => ({
  default: {},
  sign: vi.fn(),
  verify: vi.fn(),
}));

// mock environment variables
process.env.ACCESS_TOKEN_SECRET = "test-access-secret";
process.env.REFRESH_TOKEN_SECRET = "test-refresh-secret";

describe("AuthService", () => {
  let authService: AuthService;
  let mockUserRepository: UserRepository;

  const mockUser = {
    id: "user-123",
    username: "testuser",
    email: "test@example.com",
    created_at: new Date(),
    last_login: null,
  };

  const validCredentials = {
    username: "testuser",
    password: "hunter2",
  };

  const registerData = {
    username: "testuser",
    password: "hunter2",
    email: "test@example.com",
  };

  beforeEach(() => {
    mockUserRepository = {
      findAll: vi.fn(),
      findById: vi.fn(),
      findByUsername: vi.fn(),
      findByEmail: vi.fn(),
      create: vi.fn(),
      updateEmail: vi.fn(),
      updateLastLogin: vi.fn(),
      delete: vi.fn(),
      getPassword: vi.fn(),
    } as any;

    authService = new AuthService(mockUserRepository);

    vi.clearAllMocks();
  });

  // Register tests
  describe("Register", () => {
    it("should register a new user with valid data", async () => {
      vi.mocked(mockUserRepository.findByUsername).mockResolvedValue(null); // Username available
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null); // Email available
      vi.mocked(bcrypt.hash).mockResolvedValue("password" as any); // hashed password
      vi.mocked(mockUserRepository.create).mockResolvedValue(mockUser); // User created
      vi.mocked(sign)
        .mockReturnValueOnce("mock-access-token" as any)
        .mockReturnValueOnce("mock-refresh-token" as any);

      const result = await authService.register(
        registerData.username,
        registerData.email,
        registerData.password
      );

      expect(mockUserRepository.findByUsername).toHaveBeenCalledWith(
        "testuser"
      );
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        "test@example.com"
      );
      expect(bcrypt.hash).toHaveBeenCalledWith("hunter2", 10);
      expect(mockUserRepository.create).toHaveBeenCalledWith(
        { email: registerData.email, username: registerData.username },
        "password"
      );
      expect(result).toEqual({
        user: mockUser,
        tokenPair: {
          accessToken: "mock-access-token",
          refreshToken: "mock-refresh-token",
          expiresIn: 900,
        },
      });
    });
  });

  // Login tests
  describe("Login", () => {
    it("should login a user with valid credentials", async () => {
      // Arrange
      const hashedPassword =
        "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"; // Realistic bcrypt hash
      vi.mocked(mockUserRepository.findByUsername).mockResolvedValue(mockUser);
      vi.mocked(mockUserRepository.getPassword).mockResolvedValue(
        hashedPassword as any
      );
      vi.mocked(bcrypt.compare).mockResolvedValue(true as any);
      vi.mocked(mockUserRepository.updateLastLogin).mockResolvedValue(
        mockUser as any
      );
      vi.mocked(sign)
        .mockReturnValueOnce("mock-access-token" as any)
        .mockReturnValueOnce("mock-refresh-token" as any);

      // Act
      const result = await authService.login(
        validCredentials.username,
        validCredentials.password
      );

      // Assert - Verify repository calls
      expect(mockUserRepository.findByUsername).toHaveBeenCalledWith(
        validCredentials.username
      );
      expect(mockUserRepository.getPassword).toHaveBeenCalledWith(mockUser.id);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        validCredentials.password,
        hashedPassword
      );
      expect(mockUserRepository.updateLastLogin).toHaveBeenCalledWith(
        mockUser.id
      );

      // Assert - Verify JWT token generation with correct parameters
      expect(sign).toHaveBeenCalledTimes(2);
      expect(sign).toHaveBeenNthCalledWith(
        1,
        { sub: mockUser.id, type: "access" },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "15m" }
      );
      expect(sign).toHaveBeenNthCalledWith(
        2,
        { sub: mockUser.id, type: "refresh" },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "7d" }
      );

      // Assert - Verify return value
      expect(result).toEqual({
        user: mockUser,
        tokenPair: {
          accessToken: "mock-access-token",
          refreshToken: "mock-refresh-token",
          expiresIn: 900,
        },
      });
    });

    it("should throw an error if the user does not exist", async () => {
      vi.mocked(mockUserRepository.findByUsername).mockResolvedValue(null);

      // Verify it throws the correct error with message and status code
      // Note: Due to error class inheritance setup, we verify behavior (message/statusCode)
      // rather than instanceof checks
      try {
        await authService.login(
          validCredentials.username,
          validCredentials.password
        );
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.message).toBe("Invalid credentials.");
        expect(error.statusCode).toBe(401);
      }

      // Verify findByUsername was called
      expect(mockUserRepository.findByUsername).toHaveBeenCalledWith(
        validCredentials.username
      );
    });

    it("should throw an error if the password is incorrect", async () => {
      vi.mocked(mockUserRepository.findByUsername).mockResolvedValue(mockUser);
      vi.mocked(mockUserRepository.getPassword).mockResolvedValue(
        "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy" as any
      );
      vi.mocked(bcrypt.compare).mockResolvedValue(false as any);
      try {
        await authService.login(validCredentials.username, "invalidpassword");
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.message).toBe("Invalid credentials.");
        expect(error.statusCode).toBe(401);
      }
      expect(mockUserRepository.findByUsername).toHaveBeenCalledWith(
        validCredentials.username
      );
    });
  });
});
