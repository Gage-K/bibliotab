import {
  User,
  CreateUserDto,
  UpdateUserDto,
} from "../../core/types/user.types";
import { Pool } from "pg";
import { InternalServerError } from "../../common/errors/AppError";

export class UserRepository {
  constructor(private pool: Pool) {}

  async findAll(): Promise<User[]> {
    try {
      const query = "SELECT * FROM users";
      const { rows } = await this.pool.query<User>(query);
      return rows;
    } catch (error) {
      throw new InternalServerError("Failed to fetch users");
    }
  }

  async findById(id: string): Promise<User | null> {
    try {
      const query = "SELECT * FROM users WHERE id = $1";
      const { rows } = await this.pool.query<User>(query, [id]);
      return rows[0] ?? null;
    } catch (error) {
      throw new InternalServerError("Failed to fetch user by id");
    }
  }

  async findByUsername(username: string): Promise<User | null> {
    try {
      const query = "SELECT * FROM users WHERE username = $1";
      const { rows } = await this.pool.query<User>(query, [username]);
      return rows[0] ?? null;
    } catch (error) {
      throw new InternalServerError("Failed to fetch user by username");
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const query = "SELECT * FROM users WHERE email = $1";
      const { rows } = await this.pool.query<User>(query, [email]);
      return rows[0] ?? null;
    } catch (error) {
      throw new InternalServerError("Failed to fetch user by email");
    }
  }

  async getPassword(userId: string): Promise<string | null> {
    try {
      const query = "SELECT password FROM passwords WHERE user_id = $1";
      const { rows } = await this.pool.query<{ password: string }>(query, [
        userId,
      ]);
      return rows[0]?.password ?? null;
    } catch (error) {
      throw new InternalServerError("Failed to fetch user password");
    }
  }

  async create(userData: CreateUserDto, hashedPassword: string): Promise<User> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      const insertUserQuery =
        "INSERT INTO users (username, email, created_at) VALUES ($1, $2, $3) RETURNING *";
      const { rows: userRows } = await client.query<User>(insertUserQuery, [
        userData.username,
        userData.email,
        new Date(),
      ]);
      const newUser = userRows[0];

      const insertPasswordQuery =
        "INSERT INTO passwords (password, user_id) VALUES ($1, $2) RETURNING *";
      await client.query<{ id: string }>(insertPasswordQuery, [
        hashedPassword,
        newUser.id,
      ]);

      await client.query("COMMIT");
      return newUser;
    } catch (error) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Failed to rollback user creation", rollbackError);
        throw new InternalServerError("Failed to rollback user creation");
      }
      console.error("Failed to create user", error);
      throw new InternalServerError("Failed to create user");
    } finally {
      client.release();
    }
  }

  async updateEmail(
    id: string,
    newEmail: UpdateUserDto["email"]
  ): Promise<User | null> {
    try {
      const query = "UPDATE users SET email = $1 WHERE id = $2 RETURNING *";
      const result = await this.pool.query<User>(query, [newEmail, id]);
      return result.rows[0] ?? null;
    } catch (error) {
      throw new InternalServerError("Failed to update user email");
    }
  }

  async updatePassword(
    id: string,
    newPassword: UpdateUserDto["password"]
  ): Promise<boolean> {
    try {
      const query = "UPDATE passwords SET password = $1 WHERE user_id = $2";
      const result = await this.pool.query(query, [newPassword, id]);
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      throw new InternalServerError("Failed to update user password");
    }
  }

  async updateLastLogin(id: string): Promise<User | null> {
    try {
      const query =
        "UPDATE users SET last_login = $1 WHERE id = $2 RETURNING *";
      const result = await this.pool.query<User>(query, [new Date(), id]);
      return result.rows[0] ?? null;
    } catch (error) {
      throw new InternalServerError("Failed to update user last login");
    }
  }
}
