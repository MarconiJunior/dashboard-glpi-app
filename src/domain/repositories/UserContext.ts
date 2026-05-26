// Contexto do usuário autenticado passado da camada de apresentação às use cases.

export interface UserContext {
  technicianId: number
  allowedEntities: number[] // entidades do técnico logado
}
