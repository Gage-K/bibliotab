import { TabEntity, CreateTabDto, UpdateTabDto } from "../../core/types/tab.types";
import { Pool } from "pg";
import { InternalServerError } from "../../common/errors/AppError";

export interface PaginatedTabs {
  tabs: TabEntity[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class TabRepository {
  constructor(private pool: Pool) {}

  async findAll(): Promise<TabEntity[]> {
    try {
      const query = "SELECT * FROM tabs";
      const { rows } = await this.pool.query<TabEntity>(query);
      return rows;
    } catch (error) {
      throw new InternalServerError("Failed to fetch tabs");
    }
  }

  async findById(id: string): Promise<TabEntity | null> {
    try {
      const query = "SELECT * FROM tabs WHERE id = $1";
      const { rows } = await this.pool.query<TabEntity>(query, [id]);
      return rows[0] ?? null;
    } catch (error) {
      throw new InternalServerError("Failed to fetch tab by id");
    }
  }

  async findByUserId(userId: string): Promise<TabEntity[]> {
    try {
      const query = "SELECT * FROM tabs WHERE user_id = $1";
      const { rows } = await this.pool.query<TabEntity>(query, [userId]);
      return rows;
    } catch (error) {
      throw new InternalServerError("Failed to fetch tabs by user id");
    }
  }

  async findByUserIdPaginated(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedTabs> {
    try {
      const offset = (page - 1) * limit;

      const countQuery = "SELECT COUNT(*) FROM tabs WHERE user_id = $1";
      const countResult = await this.pool.query(countQuery, [userId]);
      const total = parseInt(countResult.rows[0].count, 10);

      const query = `
        SELECT * FROM tabs
        WHERE user_id = $1
        ORDER BY modified_at DESC
        LIMIT $2 OFFSET $3
      `;
      const { rows } = await this.pool.query<TabEntity>(query, [userId, limit, offset]);

      return {
        tabs: rows,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      throw new InternalServerError("Failed to fetch paginated tabs");
    }
  }

  async create(userId: string, tabData: CreateTabDto): Promise<TabEntity> {
    try {
      const now = new Date();
      const query = `
        INSERT INTO tabs (user_id, tab_name, tab_artist, tuning, created_at, modified_at, tab_data)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      const { rows } = await this.pool.query<TabEntity>(query, [
        userId,
        tabData.tab_name,
        tabData.tab_artist,
        JSON.stringify(tabData.tuning),
        now,
        now,
        JSON.stringify(tabData.tab_data),
      ]);
      return rows[0];
    } catch (error) {
      console.error("Failed to create tab", error);
      throw new InternalServerError("Failed to create tab");
    }
  }

  async update(id: string, tabData: UpdateTabDto): Promise<TabEntity | null> {
    try {
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (tabData.tab_name !== undefined) {
        updateFields.push(`tab_name = $${paramIndex}`);
        values.push(tabData.tab_name);
        paramIndex++;
      }

      if (tabData.tab_artist !== undefined) {
        updateFields.push(`tab_artist = $${paramIndex}`);
        values.push(tabData.tab_artist);
        paramIndex++;
      }

      if (tabData.tuning !== undefined) {
        updateFields.push(`tuning = $${paramIndex}`);
        values.push(JSON.stringify(tabData.tuning));
        paramIndex++;
      }

      if (tabData.tab_data !== undefined) {
        updateFields.push(`tab_data = $${paramIndex}`);
        values.push(JSON.stringify(tabData.tab_data));
        paramIndex++;
      }

      if (updateFields.length === 0) {
        return await this.findById(id);
      }

      updateFields.push(`modified_at = $${paramIndex}`);
      values.push(new Date());
      paramIndex++;

      values.push(id);

      const query = `
        UPDATE tabs
        SET ${updateFields.join(", ")}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await this.pool.query<TabEntity>(query, values);

      return result.rows[0] ?? null;
    } catch (error) {
      console.error("Failed to update tab", error);
      throw new InternalServerError("Failed to update tab");
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const query = "DELETE FROM tabs WHERE id = $1";
      const result = await this.pool.query(query, [id]);

      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error("Failed to delete tab", error);
      throw new InternalServerError("Failed to delete tab");
    }
  }
}
