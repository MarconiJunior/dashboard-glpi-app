import { NextResponse } from "next/server"
import { pool } from "@/src/infrastructure/database/connection"
import type { RowDataPacket } from "mysql2/promise"

const TECHNICIAN_ID = parseInt(process.env.TECHNICIAN_ID ?? "0", 10)

interface UserRow extends RowDataPacket {
  id: number
  name: string
  firstname: string | null
  realname: string | null
}

export async function GET() {
  if (!TECHNICIAN_ID) {
    return NextResponse.json({ id: 0, name: "—", fullName: "Técnico", firstname: null, realname: null })
  }
  try {
    const [rows] = await pool.query<UserRow[]>(
      "SELECT id, name, firstname, realname FROM glpi_users WHERE id = ? LIMIT 1",
      [TECHNICIAN_ID],
    )
    const user = rows[0]
    if (!user) {
      return NextResponse.json({ id: TECHNICIAN_ID, name: "—", fullName: "Técnico", firstname: null, realname: null })
    }
    const fullName = `${user.firstname ?? ""} ${user.realname ?? ""}`.trim() || user.name
    return NextResponse.json({ ...user, fullName })
  } catch {
    return NextResponse.json({ id: TECHNICIAN_ID, name: "—", fullName: "Técnico", firstname: null, realname: null })
  }
}
