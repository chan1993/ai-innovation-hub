export type Badge = {
  id: string
  name: string
  icon: string
  description: string
  check: (stats: UserStats) => boolean
}

export type UserStats = {
  ideaCount: number
  maxLikesOnSingleIdea: number
  isMonthlyTop: boolean
  isEarlyAdopter: boolean
}

export const BADGES: Badge[] = [
  {
    id: 'first_idea',
    name: 'First Idea',
    icon: '🌱',
    description: 'Submitted your first idea',
    check: (s) => s.ideaCount >= 1,
  },
  {
    id: 'on_fire',
    name: 'On Fire',
    icon: '🔥',
    description: 'Submitted 5 ideas',
    check: (s) => s.ideaCount >= 5,
  },
  {
    id: 'idea_machine',
    name: 'Idea Machine',
    icon: '💡',
    description: 'Submitted 10 ideas',
    check: (s) => s.ideaCount >= 10,
  },
  {
    id: 'popular',
    name: 'Popular',
    icon: '⭐',
    description: 'Received 10+ likes on a single idea',
    check: (s) => s.maxLikesOnSingleIdea >= 10,
  },
  {
    id: 'top_contributor',
    name: 'Top Contributor',
    icon: '🏆',
    description: '#1 contributor this month',
    check: (s) => s.isMonthlyTop,
  },
  {
    id: 'early_adopter',
    name: 'Early Adopter',
    icon: '👀',
    description: 'One of the first 5 people on the Hub',
    check: (s) => s.isEarlyAdopter,
  },
]

export function getEarnedBadges(stats: UserStats): Badge[] {
  return BADGES.filter((b) => b.check(stats))
}
