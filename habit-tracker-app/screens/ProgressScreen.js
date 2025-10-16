import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Calendar } from 'react-native-calendars';
import { LinearGradient } from 'expo-linear-gradient';
import dayjs from 'dayjs';
import Animated, { Layout, FadeIn, FadeOut } from 'react-native-reanimated';

const calculateStreaks = (completedDates) => {
  if (completedDates.length === 0) return { currentStreak: 0, bestStreak: 0 };
  const sortedDates = completedDates.sort((a, b) => new Date(a) - new Date(b));
  let bestStreak = 1, currentStreak = 1;
  for (let i = 1; i < sortedDates.length; i++) {
    const currentDate = dayjs(sortedDates[i]);
    const prevDate = dayjs(sortedDates[i - 1]);
    if (currentDate.diff(prevDate, 'day') === 1) {
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

export default function ProgressScreen() {
  const [habits, setHabits] = useState([]);

  const fetchHabits = async () => {
    try {
      const storedHabits = await AsyncStorage.getItem('habits');
      setHabits(storedHabits ? JSON.parse(storedHabits) : []);
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível carregar o progresso.');
    }
  };

  useFocusEffect(useCallback(() => { fetchHabits(); }, []));

  const renderItem = ({ item }) => {
    const completedEntries = item.completed ? Object.entries(item.completed) : [];
    const completedDates = completedEntries.map(([date]) => date);
    const { currentStreak, bestStreak } = calculateStreaks(completedDates);
    const totalDaysSinceCreation = item.createdAt ? dayjs().diff(dayjs(item.createdAt), 'day') + 1 : 1;
    const successRate = completedDates.length > 0 ? ((completedDates.length / totalDaysSinceCreation) * 100).toFixed(0) : 0;

    const markedDates = completedEntries.reduce((acc, [date]) => {
      acc[date] = { selected: true, selectedColor: '#10B981' };
      return acc;
    }, {});

    const entriesWithContent = completedEntries
      .filter(([, data]) => data.photoUri || data.note)
      .sort((a, b) => new Date(b[0]) - new Date(a[0]));

    return (
      <Animated.View layout={Layout.springify()}>
        <LinearGradient colors={['#F9FAFB', '#E5E7EB']} style={styles.habitCard}>
          <Text style={styles.habitName}>{item.name}</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statBox}><Text style={styles.statValue}>{currentStreak}</Text><Text style={styles.statLabel}>Sequência</Text></View>
            <View style={styles.statBox}><Text style={styles.statValue}>{bestStreak}</Text><Text style={styles.statLabel}>Recorde</Text></View>
            <View style={styles.statBox}><Text style={styles.statValue}>{successRate}%</Text><Text style={styles.statLabel}>Sucesso</Text></View>
          </View>
          <View style={styles.calendarContainer}><Calendar current={dayjs().format('YYYY-MM-DD')} markedDates={markedDates} theme={calendarTheme} /></View>

          {entriesWithContent.length > 0 && (
            <View style={styles.journalContainer}>
              <Text style={styles.journalTitle}>Diário</Text>
              {entriesWithContent.map(([date, data]) => (
                <View key={date} style={styles.journalEntry}>
                  <Text style={styles.journalDate}>{dayjs(date).format('DD/MM/YYYY')}</Text>
                  {data.photoUri && <Image source={{ uri: data.photoUri }} style={styles.photo} />}
                  {data.note && <Text style={styles.noteText}>"{data.note}"</Text>}
                </View>
              ))}
            </View>
          )}
        </LinearGradient>
      </Animated.View>
    );
  };

  return (
    <LinearGradient colors={['#8E2DE2', '#4A00E0']} style={styles.container}>
      <Text style={styles.title}>Meu Progresso</Text>
      <FlatList
        data={habits}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<View style={styles.emptyContainer}><Text style={styles.emptyText}>Sem progresso para mostrar.</Text></View>}
        contentContainerStyle={styles.listContentContainer}
      />
    </LinearGradient>
  );
}

const calendarTheme = {
  calendarBackground: 'transparent', textSectionTitleColor: '#6B7280',
  selectedDayBackgroundColor: '#10B981', selectedDayTextColor: '#ffffff',
  todayTextColor: '#EF4444', dayTextColor: '#1F2937', arrowColor: '#4A00E0',
  monthTextColor: '#1F2937', textMonthFontWeight: 'bold',
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginVertical: 20, marginTop: 40 },
  listContentContainer: { paddingHorizontal: 10, paddingBottom: 20 },
  habitCard: { borderRadius: 15, padding: 20, marginVertical: 10, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  habitName: { fontSize: 22, fontWeight: 'bold', color: '#1F2937', marginBottom: 15 },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 15, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#D1D5DB', paddingVertical: 15 },
  statBox: { alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#4A00E0' },
  statLabel: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  calendarContainer: { borderRadius: 10, overflow: 'hidden', marginBottom: 15 },
  journalContainer: { marginTop: 10, borderTopWidth: 1, borderColor: '#D1D5DB', paddingTop: 15 },
  journalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 10 },
  journalEntry: { marginBottom: 15, backgroundColor: 'rgba(255,255,255,0.5)', padding: 10, borderRadius: 10 },
  journalDate: { fontSize: 14, fontWeight: '600', color: '#4B5563', marginBottom: 8 },
  photo: { width: '100%', height: 150, borderRadius: 8, marginBottom: 8 },
  noteText: { fontStyle: 'italic', color: '#374151' },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { fontSize: 18, color: '#fff', opacity: 0.8 },
});