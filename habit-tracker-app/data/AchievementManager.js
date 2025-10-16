import AsyncStorage from '@react-native-async-storage/async-storage';
import { ACHIEVEMENTS } from './gamification';
import * as Notifications from 'expo-notifications';
import dayjs from 'dayjs';

const UNLOCKED_ACHIEVEMENTS_KEY = 'unlocked_achievements';

// Helper function to calculate streaks for a single habit
const calculateStreaks = (completedDates) => {
  if (completedDates.length === 0) return { currentStreak: 0, bestStreak: 0 };
  const sortedDates = completedDates.sort((a, b) => new Date(a) - new Date(b));
  let bestStreak = 1, currentStreak = 1;
  for (let i = 1; i < sortedDates.length; i++) {
    if (dayjs(sortedDates[i]).diff(dayjs(sortedDates[i - 1]), 'day') === 1) {
      currentStreak++;
    } else {
      currentStreak = 1;
    }
    if (currentStreak > bestStreak) bestStreak = currentStreak;
  }
  const lastCompletion = dayjs(sortedDates[sortedDates.length - 1]);
  if (!lastCompletion.isSame(dayjs(), 'day') && !lastCompletion.isSame(dayjs().subtract(1, 'day'), 'day')) {
    currentStreak = 0;
  }
  return { currentStreak, bestStreak };
};

// Function to get unlocked achievements
export const getUnlockedAchievements = async () => {
  const data = await AsyncStorage.getItem(UNLOCKED_ACHIEVEMENTS_KEY);
  return data ? JSON.parse(data) : [];
};

// The core function to check for new achievements
export const checkAndUnlockAchievements = async () => {
  const habits = JSON.parse(await AsyncStorage.getItem('habits') || '[]');
  if (habits.length === 0) return;

  const unlockedAchievements = await getUnlockedAchievements();

  // Calculate stats for all habits
  const stats = habits.map(habit => {
    const completedDates = Object.keys(habit.completed || {});
    return { id: habit.id, ...calculateStreaks(completedDates) };
  });

  const newAchievements = [];

  for (const achievement of Object.values(ACHIEVEMENTS)) {
    if (unlockedAchievements.includes(achievement.id)) {
      continue; // Already unlocked
    }

    if (achievement.condition(habits, stats)) {
      newAchievements.push(achievement.id);

      Notifications.scheduleNotificationAsync({
        content: {
          title: '🏆 Conquista Desbloqueada!',
          body: `Você ganhou: ${achievement.title}`,
        },
        trigger: null,
      });
    }
  }

  if (newAchievements.length > 0) {
    const updatedAchievements = [...unlockedAchievements, ...newAchievements];
    await AsyncStorage.setItem(UNLOCKED_ACHIEVEMENTS_KEY, JSON.stringify(updatedAchievements));
  }
};