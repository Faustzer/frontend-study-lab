export interface ModuleMeta {
  title?: string
  description?: string
  difficulty?: 'easy' | 'medium' | 'hard'
  xp?: number
  order?: number
  tags?: string[]
}

export interface CategoryMeta {
  title?: string
  description?: string
  icon?: string
  order?: number
}
