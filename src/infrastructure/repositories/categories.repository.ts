import { pool } from "../database/connection";

import type { RowDataPacket } from "mysql2/promise"
import type { ICategoriesRepository, GlpiCategoryRow } from "@/src/domain/repositories/ICategoriesRepository"

class CategoriesRepository implements ICategoriesRepository {
  async list(): Promise<GlpiCategoryRow[]> {
    try {
      interface CatRow extends RowDataPacket {
        id: number
        name: string
        completename: string | null
      }
      const [rows] = await pool.query<CatRow[]>(
        "SELECT id, name, completename FROM glpi_itilcategories ORDER BY completename ASC",
      )
      return rows
    } catch (err) {
      console.error("[categories.repository] list:", err)
      return []
    }
  }
}

export const categoriesRepository: ICategoriesRepository = new CategoriesRepository()
