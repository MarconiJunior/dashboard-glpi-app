// Interface do repositório de categorias.

export interface GlpiCategoryRow {
  id: number
  name: string
  completename: string | null
}

export interface ICategoriesRepository {
  list(): Promise<GlpiCategoryRow[]>
}
