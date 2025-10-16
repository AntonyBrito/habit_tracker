import React, { useState, useCallback, useContext } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, Image, UIManager, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { Layout, FadeIn, FadeOut } from 'react-native-reanimated';
import dayjs from 'dayjs';
import { checkAndUnlockAchievements } from '../data/AchievementManager';
import { ThemeContext } from '../data/ThemeContext';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const isHabitDueToday = (habit) => {
  const todayIndex = dayjs().day();
  const { type, specificDays } = habit.frequency;
  if (type === 'daily') return true;
  if (type === 'specificDays') return specificDays.includes(todayIndex);
  if (type === 'weekly') return true;
  return false;
};

export default function HabitListScreen({ navigation }) {
  const { colors } = useContext(ThemeContext);
  const [habits, setHabits] = useState([]);

  const fetchHabits = async () => {
    try {
      const allHabits = JSON.parse(await AsyncStorage.getItem('habits') || '[]');
      setHabits(allHabits.filter(isHabitDueToday));
    } catch (error) { console.error(error); }
  };

  useFocusEffect(useCallback(() => { fetchHabits(); }, []));

  const updateHabitState = async (updatedHabits) => {
    setHabits(updatedHabits.filter(isHabitDueToday));
    const allHabits = JSON.parse(await AsyncStorage.getItem('habits') || '[]');
    const newAllHabits = allHabits.map(h => updatedHabits.find(uh => uh.id === h.id) || h);
    await AsyncStorage.setItem('habits', JSON.stringify(newAllHabits));
    checkAndUnlockAchievements();
  };

  const handleCounterChange = (habitId, change) => {
    const today = dayjs().format('YYYY-MM-DD');
    const updatedHabits = habits.map(h => {
      if (h.id === habitId) {
        const currentCount = h.completed?.[today]?.count || 0;
        const newCount = Math.max(0, currentCount + change);
        return { ...h, completed: { ...h.completed, [today]: { ...h.completed?.[today], count: newCount, done: newCount >= h.goal.target } } };
      }
      return h;
    });
    updateHabitState(updatedHabits);
  };

  const markHabitAsDone = (habitId) => {
    const today = dayjs().format('YYYY-MM-DD');
    const updatedHabits = habits.map(h => h.id === habitId ? { ...h, completed: { ...h.completed, [today]: { ...h.completed?.[today], done: true } } } : h);
    updateHabitState(updatedHabits);
  };

  const unmarkHabit = (habitId) => {
    const today = dayjs().format('YYYY-MM-DD');
    const updatedHabits = habits.map(h => {
        if (h.id === habitId) {
            const newCompleted = { ...h.completed };
            delete newCompleted[today];
            return { ...h, completed: newCompleted };
        }
        return h;
    });
    updateHabitState(updatedHabits);
  };

  const deleteHabit = async (habitId) => {
    const allHabits = JSON.parse(await AsyncStorage.getItem('habits') || '[]');
    const habitToDelete = allHabits.find(h => h.id === habitId);
    if (habitToDelete?.notificationId) await Notifications.cancelAllScheduledNotificationsAsync();
    const updatedAllHabits = allHabits.filter(h => h.id !== habitId);
    setHabits(updatedAllHabits.filter(isHabitDueToday));
    await AsyncStorage.setItem('habits', JSON.stringify(updatedAllHabits));
  };

  const confirmDeleteHabit = (habitId) => Alert.alert('Remover Hábito', 'Tem certeza?',
    [{ text: 'Cancelar' }, { text: 'Remover', onPress: () => deleteHabit(habitId), style: 'destructive' }]
  );

  const renderItem = ({ item }) => {
    const today = dayjs().format('YYYY-MM-DD');
    const completionData = item.completed?.[today];
    const isCompletedToday = completionData?.done;

    const isCheckHabit = item.goal.type === 'check';
    const currentCount = completionData?.count || 0;
    const targetCount = item.goal.target;

    return (
      <Animated.View entering={FadeIn.duration(500)} exiting={FadeOut.duration(300)} layout={Layout.springify()}>
        <LinearGradient colors={isCompletedToday ? [colors.accent, '#34D399'] : colors.card} style={styles.habitCard}>
          <View style={styles.habitHeader}>
            <Text style={[styles.habitName, { color: isCompletedToday ? '#fff' : colors.text }]}>{item.name}</Text>
            <View style={styles.actionsContainer}>
              <TouchableOpacity onPress={() => navigation.navigate('EditHabit', { habitId: item.id })} style={styles.iconButton}><Feather name="edit-2" size={20} color={isCompletedToday ? '#fff' : colors.subtext} /></TouchableOpacity>
              <TouchableOpacity onPress={() => confirmDeleteHabit(item.id)} style={styles.iconButton}><Feather name="trash-2" size={20} color={isCompletedToday ? '#fff' : '#E53935'} /></TouchableOpacity>
            </View>
          </View>

          <View style={styles.habitFooter}>
            {isCompletedToday ? (
                <TouchableOpacity style={styles.statusButton} onPress={() => unmarkHabit(item.id)}>
                    <Feather name="check-circle" size={24} color="white" /><Text style={styles.statusButtonText}>Hábito Concluído!</Text>
                </TouchableOpacity>
            ) : isCheckHabit ? (
                <TouchableOpacity style={styles.actionButton} onPress={() => markHabitAsDone(item.id)}>
                    <Feather name="check" size={20} color={colors.accent} /><Text style={[styles.actionButtonText, { color: colors.text }]}>Marcar como Feito</Text>
                </TouchableOpacity>
            ) : (
                <View style={styles.counterContainer}>
                    <TouchableOpacity onPress={() => handleCounterChange(item.id, -1)} style={styles.counterButton}><Feather name="minus" size={24} color={colors.primary} /></TouchableOpacity>
                    <Text style={[styles.counterText, { color: colors.text }]}>{currentCount} / {targetCount}</Text>
                    <TouchableOpacity onPress={() => handleCounterChange(item.id, 1)} style={styles.counterButton}><Feather name="plus" size={24} color={colors.primary} /></TouchableOpacity>
                </View>
            )}
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };

  return (
    <LinearGradient colors={colors.background} style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>Hábitos de Hoje</Text>
      <FlatList
        data={habits}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<View style={styles.emptyContainer}><Text style={[styles.emptyText, { color: colors.subtext }]}>Nenhum hábito para hoje!</Text></View>}
        contentContainerStyle={styles.listContentContainer}
      />
      <View style={styles.addButtonContainer}>
        <TouchableOpacity onPress={() => navigation.navigate('AddHabit')}>
          <LinearGradient colors={[colors.primary, '#8B5CF6']} style={styles.addButton}><Feather name="plus" size={24} color="white" /><Text style={styles.addButtonText}>Novo Hábito</Text></LinearGradient>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 32, fontWeight: 'bold', textAlign: 'center', paddingVertical: 20, paddingTop: 50 },
  listContentContainer: { paddingHorizontal: 10, paddingBottom: 100 },
  habitCard: { borderRadius: 15, padding: 20, marginVertical: 8, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5 },
  habitHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  habitName: { fontSize: 20, fontWeight: '600', flex: 1 },
  completedText: { textDecorationLine: 'line-through' },
  actionsContainer: { flexDirection: 'row' },
  iconButton: { marginLeft: 15, padding: 5 },
  habitFooter: { marginTop: 15, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', paddingTop: 10 },
  statusButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10 },
  statusButtonText: { color: 'white', fontWeight: 'bold', marginLeft: 10, fontSize: 16 },
  actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 10, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 10 },
  actionButtonText: { marginLeft: 8, fontWeight: '500' },
  counterContainer: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingTop: 15, marginTop: 15, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
  counterButton: { padding: 10 },
  counterText: { fontSize: 24, fontWeight: 'bold' },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { fontSize: 18, opacity: 0.8 },
  addButtonContainer: { position: 'absolute', bottom: 20, left: 20, right: 20 },
  addButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 15, borderRadius: 15, elevation: 8, shadowColor: '#000', shadowRadius: 8, shadowOpacity: 0.3 },
  addButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
});