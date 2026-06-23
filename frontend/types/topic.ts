export interface TopicItem {
  slug: string
  title: string
  description: string
  i18nTitleKey: string
  i18nDescriptionKey: string
  category: string
  order: number
  difficulty: 'easy' | 'medium' | 'hard'
  xpReward: number
  component: () => Promise<any>
  sourcePath: string
  tags: string[]
}

export interface TopicCategory {
  slug: string
  title: string
  description: string
  i18nTitleKey: string
  i18nDescriptionKey: string
  icon: string
  order: number
  items: TopicItem[]
}

/** @deprecated use TopicCategory instead */
export interface Topic {
  title: string
  href: string
  items?: Topic[]
}
