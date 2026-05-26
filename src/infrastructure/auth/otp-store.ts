// Armazenamento em memória de OTPs temporários.
// Adequado para instância única (Next.js em servidor único).
// TTL padrão: 5 minutos. Máximo de tentativas: 5.

import { VerifyOtpResultReason } from "@/src/application/use-cases/auth.use-case";

interface OtpEntry {
  code: string
  expiresAt: number
  attempts: number
}

const store = new Map<string, OtpEntry>()

const TTL_MS = 5 * 60 * 1000  // 5 minutos
const MAX_ATTEMPTS = 5

/** Cria e armazena um novo OTP de 6 dígitos para o e-mail. */
export function createOtp(email: string): string {
  const code = String(Math.floor(100_000 + Math.random() * 900_000))
  store.set(email.toLowerCase(), { code, expiresAt: Date.now() + TTL_MS, attempts: 0 })
  return code
}

/** Valida o OTP. Retorna true e limpa a entrada em caso de sucesso. */
export function verifyOtp(email: string, code: string): { ok: boolean; reason?: VerifyOtpResultReason } {
  const key = email.toLowerCase()
  const entry = store.get(key)

  if (!entry) return { ok: false, reason: "not_found" }
  if (Date.now() > entry.expiresAt) {
    store.delete(key)
    return { ok: false, reason: "expired" }
  }

  entry.attempts++
  if (entry.attempts > MAX_ATTEMPTS) {
    store.delete(key)
    return { ok: false, reason: "too_many_attempts" }
  }

  if (entry.code !== code) return { ok: false, reason: "invalid_code" }

  store.delete(key)
  return { ok: true }
}

/** Verifica se já existe um OTP ativo (para rate-limit de reenvio). */
export function hasActiveOtp(email: string): boolean {
  const entry = store.get(email.toLowerCase())
  if (!entry) return false
  if (Date.now() > entry.expiresAt) {
    store.delete(email.toLowerCase())
    return false
  }
  return true
}
