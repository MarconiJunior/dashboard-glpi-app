// Repositório de gestão geral — visão de supervisor sobre todas as entidades.

import { pool } from "../database/connection";
import type { RowDataPacket } from "mysql2/promise";
import type {
  IManagementRepository,
  ManagementOverview,
  TechnicianStats,
  DateFilters,
} from "@/src/domain/repositories/IManagementRepository";

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

async function q<T extends RowDataPacket>(sql: string, params: unknown[] = []): Promise<T[]> {
  const [rows] = await pool.query<T[]>(sql, params);
  return rows;
}

function entitiesIn(entities: number[]): string {
  return entities.length > 0 ? entities.join(",") : "0";
}

/** Adiciona cláusulas de data à query. Retorna fragmento SQL + params extras. */
function dateClause(alias: string, col: string, filters?: DateFilters): { sql: string; params: unknown[] } {
  const parts: string[] = [];
  const params: unknown[] = [];
  if (filters?.dateFrom) {
    parts.push(`${alias}.${col} >= ?`);
    params.push(filters.dateFrom);
  }
  if (filters?.dateTo) {
    parts.push(`DATE(${alias}.${col}) <= ?`);
    params.push(filters.dateTo);
  }
  return { sql: parts.length ? " AND " + parts.join(" AND ") : "", params };
}

// ---------------------------------------------------------------------------
// Implementação
// ---------------------------------------------------------------------------

class ManagementRepository implements IManagementRepository {
  async getOverview(entities: number[], filters?: DateFilters): Promise<ManagementOverview> {
    const ein = entitiesIn(entities);
    const { sql: dateSql, params: dateParams } = dateClause("t", "date_creation", filters);

    interface CountRow extends RowDataPacket { c: number }
    interface AvgRow extends RowDataPacket { v: number | null }

    const [openRows, newRows, resolvedRows, slaRows, avgResRows, avgSatRows] = await Promise.all([
      // Em aberto (1=new, 2=assigned, 3=planned, 4=pending)
      q<CountRow>(
        `SELECT COUNT(*) AS c FROM glpi_tickets t
         WHERE t.is_deleted = 0 AND t.entities_id IN (${ein})
           AND t.status NOT IN (5, 6)${dateSql}`,
        [...dateParams],
      ),

      // Novos sem técnico atribuído
      q<CountRow>(
        `SELECT COUNT(DISTINCT t.id) AS c FROM glpi_tickets t
         LEFT JOIN glpi_tickets_users tu ON tu.tickets_id = t.id AND tu.type = 2
         WHERE t.is_deleted = 0 AND t.entities_id IN (${ein})
           AND t.status = 1 AND tu.id IS NULL${dateSql}`,
        [...dateParams],
      ),

      // Resolvidos/fechados no período
      q<CountRow>(
        `SELECT COUNT(*) AS c FROM glpi_tickets t
         WHERE t.is_deleted = 0 AND t.entities_id IN (${ein})
           AND t.status IN (5, 6)${dateSql}`,
        [...dateParams],
      ),

      // SLA vencido
      q<CountRow>(
        `SELECT COUNT(*) AS c FROM glpi_tickets t
         WHERE t.is_deleted = 0 AND t.entities_id IN (${ein})
           AND t.status NOT IN (5, 6)
           AND t.time_to_resolve IS NOT NULL
           AND t.time_to_resolve < NOW()${dateSql}`,
        [...dateParams],
      ),

      // Tempo médio de resolução (em horas)
      q<AvgRow>(
        `SELECT AVG(t.solve_delay_stat) / 3600 AS v FROM glpi_tickets t
         WHERE t.is_deleted = 0 AND t.entities_id IN (${ein})
           AND t.status IN (5, 6) AND t.solve_delay_stat > 0${dateSql}`,
        [...dateParams],
      ),

      // Satisfação média
      q<AvgRow>(
        `SELECT AVG(s.satisfaction) AS v
         FROM glpi_ticketsatisfactions s
         INNER JOIN glpi_tickets t ON t.id = s.tickets_id AND t.is_deleted = 0
         WHERE t.entities_id IN (${ein})
           AND s.satisfaction IS NOT NULL AND s.date_answered IS NOT NULL${dateSql}`,
        [...dateParams],
      ),
    ]);

    return {
      totalOpen: openRows[0]?.c ?? 0,
      newUnassigned: newRows[0]?.c ?? 0,
      resolvedInPeriod: resolvedRows[0]?.c ?? 0,
      slaOverdue: slaRows[0]?.c ?? 0,
      avgResolutionHours: avgResRows[0]?.v ?? 0,
      avgSatisfaction: avgSatRows[0]?.v ?? 0,
    };
  }

  async getTechnicianStats(entities: number[], filters?: DateFilters): Promise<TechnicianStats[]> {
    const ein = entitiesIn(entities);
    const { sql: dateSql, params: dateParams } = dateClause("t", "date_creation", filters);

    interface TechRow extends RowDataPacket {
      id: number
      name: string
      firstname: string | null
      realname: string | null
      assigned: number
      resolved: number
      pending: number
      sla_overdue: number
      avg_satisfaction: number | null
      avg_resolution_hours: number | null
    }

    const rows = await q<TechRow>(
      `
      SELECT
        u.id,
        u.name,
        u.firstname,
        u.realname,
        COUNT(DISTINCT t.id)                                                          AS assigned,
        COUNT(DISTINCT CASE WHEN t.status IN (5, 6) THEN t.id END)                   AS resolved,
        COUNT(DISTINCT CASE WHEN t.status IN (3, 4) THEN t.id END)                   AS pending,
        COUNT(DISTINCT CASE
          WHEN t.time_to_resolve IS NOT NULL
           AND t.time_to_resolve < NOW()
           AND t.status NOT IN (5, 6) THEN t.id END)                                 AS sla_overdue,
        AVG(s.satisfaction)                                                           AS avg_satisfaction,
        AVG(CASE WHEN t.status IN (5,6) AND t.solve_delay_stat > 0
            THEN t.solve_delay_stat END) / 3600                                       AS avg_resolution_hours
      FROM glpi_users u
      INNER JOIN glpi_tickets_users tu ON tu.users_id = u.id AND tu.type = 2
      INNER JOIN glpi_tickets t
        ON t.id = tu.tickets_id AND t.is_deleted = 0
        AND t.entities_id IN (${ein})${dateSql}
      LEFT JOIN glpi_ticketsatisfactions s
        ON s.tickets_id = t.id AND s.satisfaction IS NOT NULL AND s.date_answered IS NOT NULL
      WHERE u.is_deleted = 0
      GROUP BY u.id, u.name, u.firstname, u.realname
      ORDER BY assigned DESC
      `,
      [...dateParams],
    );

    return rows.map((r) => ({
      id: r.id,
      fullName: `${r.firstname ?? ""} ${r.realname ?? ""}`.trim() || r.name,
      assigned: r.assigned,
      resolved: r.resolved,
      pending: r.pending,
      slaOverdue: r.sla_overdue,
      avgSatisfaction: r.avg_satisfaction != null ? Number(r.avg_satisfaction.toFixed(2)) : null,
      avgResolutionHours: r.avg_resolution_hours != null ? Number(r.avg_resolution_hours.toFixed(1)) : null,
    }));
  }

  async getStatusDistribution(entities: number[], filters?: DateFilters): Promise<{ status: string; count: number }[]> {
    const ein = entitiesIn(entities);
    const { sql: dateSql, params: dateParams } = dateClause("t", "date_creation", filters);

    interface StatusRow extends RowDataPacket { status: number; count: number }

    const statusLabels: Record<number, string> = {
      1: "new", 2: "assigned", 3: "planned", 4: "pending", 5: "solved", 6: "closed",
    };

    const rows = await q<StatusRow>(
      `SELECT t.status, COUNT(*) AS count FROM glpi_tickets t
       WHERE t.is_deleted = 0 AND t.entities_id IN (${ein})${dateSql}
       GROUP BY t.status ORDER BY t.status`,
      [...dateParams],
    );

    return rows.map((r) => ({ status: statusLabels[r.status] ?? String(r.status), count: r.count }));
  }

  async getCategoryDistribution(entities: number[], filters?: DateFilters): Promise<{ category: string; count: number }[]> {
    const ein = entitiesIn(entities);
    const { sql: dateSql, params: dateParams } = dateClause("t", "date_creation", filters);

    interface CatRow extends RowDataPacket { category: string; count: number }

    const rows = await q<CatRow>(
      `SELECT COALESCE(cat.name, 'Sem categoria') AS category, COUNT(*) AS count
       FROM glpi_tickets t
       LEFT JOIN glpi_itilcategories cat ON cat.id = t.itilcategories_id
       WHERE t.is_deleted = 0 AND t.entities_id IN (${ein})${dateSql}
       GROUP BY cat.name ORDER BY count DESC LIMIT 12`,
      [...dateParams],
    );

    return rows.map((r) => ({ category: r.category, count: r.count }));
  }

  async getMonthlyEvolution(entities: number[]): Promise<{ month: string; abertos: number; resolvidos: number }[]> {
    const ein = entitiesIn(entities);

    interface MonthRow extends RowDataPacket { ym: string; abertos: number; resolvidos: number }

    const rows = await q<MonthRow>(
      `
      SELECT
        DATE_FORMAT(t.date_creation, '%Y-%m') AS ym,
        COUNT(*) AS abertos,
        SUM(CASE WHEN t.status IN (5, 6) THEN 1 ELSE 0 END) AS resolvidos
      FROM glpi_tickets t
      WHERE t.is_deleted = 0
        AND t.entities_id IN (${ein})
        AND t.date_creation >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY ym ORDER BY ym
      `,
      [],
    );

    return rows.map((r) => {
      const [y, m] = r.ym.split("-");
      const month = new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("pt-BR", { month: "short" });
      return { month, abertos: r.abertos, resolvidos: r.resolvidos };
    });
  }
}

export const managementRepository: IManagementRepository = new ManagementRepository();
