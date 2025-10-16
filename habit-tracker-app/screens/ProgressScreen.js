import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, Image, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Calendar } from 'react-native-calendars';
import { Feather } from '@expo/vector-icons';
import dayjs from 'dayjs';

const calculateStreaks = (completedDates) => {
  if (completedDates.length === 0) {
    return { currentStreak: 0, bestStreak: 0 };
  }
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
    if (currentStreak > bestStreak) {
      bestStreak = currentStreak;
    }
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
      acc[date] = { selected: true, selectedColor: '#34C759' };
      return acc;
    }, {});

    const entriesWithNotesOrPhotos = completedEntries
      .filter(([, data]) => data.photoUri || data.note)
      .sort((a, b) => new Date(b[0]) - new Date(a[0]));

    return (
      <View style={styles.habitCard}>
        <Text style={styles.habitName}>{item.name}</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statBox}><Text style={styles.statValue}>{currentStreak}</Text><Text style={styles.statLabel}>Sequência</Text></View>
          <View style={styles.statBox}><Text style={styles.statValue}>{bestStreak}</Text><Text style={styles.statLabel}>Recorde</Text></View>
          <View style={styles.statBox}><Text style={styles.statValue}>{successRate}%</Text><Text style={styles.statLabel}>Sucesso</Text></View>
        </View>
        <View style={styles.calendarContainer}><Calendar current={dayjs().format('YYYY-MM-DD')} markedDates={markedDates} theme={calendarTheme} /></View>

        {entriesWithNotesOrPhotos.length > 0 && (
          <View style={styles.journalContainer}>
            <Text style={styles.journalTitle}>Diário do Hábito</Text>
            {entriesWithNotesOrPhotos.map(([date, data]) => (
              <View key={date} style={styles.journalEntry}>
                <Text style={styles.journalDate}>{dayjs(date).format('DD/MM/YYYY')}</Text>
                {data.photoUri && <Image source={{ uri: data.photoUri }} style={styles.photo} />}
                {data.note && <Text style={styles.noteText}>"{data.note}"</Text>}
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Meu Progresso</Text>
      <FlatList
        data={habits}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<View style={styles.emptyContainer}><Text style={styles.emptyText}>Sem progresso para mostrar.</Text></View>}
        contentContainerStyle={styles.listContentContainer}
      />
    </View>
  );
}

const calendarTheme = {
  calendarBackground: '#fff',
  textSectionTitleColor: '#b6c1cd',
  selectedDayBackgroundColor: '#34C759',
  selectedDayTextColor: '#ffffff',
  todayTextColor: '#007AFF',
  dayTextColor: '#2d4150',
  arrowColor: '#007AFF',
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  title: { fontSize: 24, fontWeight: 'bold', margin: 20, marginBottom: 10, textAlign: 'center', color: '#333' },
  listContentContainer: { paddingHorizontal: 10, paddingBottom: 20 },
  habitCard: { backgroundColor: '#ffffff', borderRadius: 12, padding: 20, marginVertical: 10, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  habitName: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 15, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#eee', paddingVertical: 10 },
  statBox: { alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: 'bold', color: '#007AFF' },
  statLabel: { fontSize: 12, color: '#666', marginTop: 2 },
  calendarContainer: { borderRadius: 10, overflow: 'hidden', marginBottom: 15 },
  journalContainer: { marginTop: 10, borderTopWidth: 1, borderColor: '#eee', paddingTop: 15 },
  journalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  journalEntry: { marginBottom: 15 },
  journalDate: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 5 },
  photo: { width: '100%', height: 150, borderRadius: 8, marginBottom: 5 },
  noteText: { fontStyle: 'italic', color: '#555', backgroundColor: '#f9f9f9', padding: 10, borderRadius: 5 },
  emptyContainer: { alignItems: 'center', marginTop: 50 },
  emptyText: { fontSize: 18, color: '#888' },
});