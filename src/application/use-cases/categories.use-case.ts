// Caso de uso: listagem de categorias ITIL.

import { categoriesRepository } from "@/src/infrastructure/repositories/categories.repository";

export async function getCategories() {
  return categoriesRepository.list();
}
