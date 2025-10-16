export const ACHIEVEMENTS = {
  FIRST_HABIT: {
    id: 'FIRST_HABIT',
    title: 'Começando a Jornada',
    description: 'Você criou seu primeiro hábito!',
    icon: 'rocket',
    condition: (habits) => habits.length >= 1,
  },
  FIRST_COMPLETION: {
    id: 'FIRST_COMPLETION',
    title: 'Primeiro Passo',
    description: 'Você completou um hábito pela primeira vez!',
    icon: 'flag',
    condition: (habits) => habits.some(h => Object.keys(h.completed || {}).length > 0),
  },
  STREAK_7: {
    id: 'STREAK_7',
    title: 'Em Chamas!',
    description: 'Você manteve uma sequência de 7 dias em qualquer hábito.',
    icon: 'zap',
    condition: (habits, stats) => stats.some(s => s.bestStreak >= 7),
  },
  PERFECT_WEEK: {
    id: 'PERFECT_WEEK',
    title: 'Semana Perfeita',
    description: 'Você completou todos os seus hábitos diários por 7 dias seguidos.',
    icon: 'award',
    condition: (habits) => {
      const dailyHabits = habits.filter(h => h.frequency.type === 'daily');
      if (dailyHabits.length === 0) return false;

      for (let i = 0; i < 7; i++) {
        const dateToCheck = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
        const allDoneOnDay = dailyHabits.every(h => h.completed?.[dateToCheck]?.done);
        if (!allDoneOnDay) return false;
      }
      return true;
    },
  },
};

export const JOURNEYS = [
  {
    id: 'MORNING_ROUTINE',
    title: 'Manhã Produtiva',
    description: 'Comece seu dia com energia e foco.',
    icon: 'sunrise',
    habits: [
      { name: 'Beber um copo d\'água ao acordar', goal: { type: 'check', target: 1 } },
      { name: 'Meditar por 5 minutos', goal: { type: 'check', target: 1 } },
      { name: 'Planejar o dia', goal: { type: 'check', target: 1 } },
    ],
  },
  {
    id: 'HEALTHY_LIFESTYLE',
    title: 'Vida Saudável',
    description: 'Pequenos passos para uma vida mais saudável.',
    icon: 'heart',
    habits: [
      { name: 'Beber 2L de água', goal: { type: 'count', target: 8 } },
      { name: 'Fazer 30 minutos de exercício', goal: { type: 'check', target: 1 } },
      { name: 'Comer 3 porções de frutas', goal: { type: 'count', target: 3 } },
    ],
  },
];