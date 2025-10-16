import React, { useState, useCallback, useContext } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, Image, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { CalendarList } from 'react-native-calendars';
import { LinearGradient } from 'expo-linear-gradient';
import dayjs from 'dayjs';
import Animated from 'react-native-reanimated';
import { ThemeContext } from '../data/ThemeContext';
import { calculateStreaks } from '../data/AchievementManager';

export default function ProgressScreen() {
  const { colors } = useContext(ThemeContext);
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);

  // ... (fetchHabits function remains the same)

  const renderItem = ({ item }) => {
    const completedEntries = item.completed ? Object.entries(item.completed) : [];
    const completedDates = completedEntries.map(([date]) => date);
    const { currentStreak, bestStreak } = calculateStreaks(completedDates);
    const totalDaysSinceCreation = item.createdAt ? dayjs().diff(dayjs(item.createdAt), 'day') + 1 : 1;
    const successRate = completedDates.length > 0 ? ((completedDates.length / totalDaysSinceCreation) * 100).toFixed(0) : 0;

    const markedDates = completedEntries.reduce((acc, [date]) => {
      acc[date] = { selected: true, selectedColor: colors.accent };
      return acc;
    }, {});

    const entriesWithNotesOrPhotos = completedEntries
      .filter(([, data]) => data.photoUri || data.note)
      .sort((a, b) => new Date(b[0]) - new Date(a[0]));

    const styles = getStyles(colors);
    const calendarTheme = getCalendarTheme(colors);

    return (
      <Animated.View layout={Layout.springify()}>
        <LinearGradient colors={colors.card} style={styles.habitCard}>
          <Text style={styles.habitName}>{item.name}</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statBox}><Text style={[styles.statValue, {color: colors.primary}]}>{currentStreak}</Text><Text style={styles.statLabel}>Sequência</Text></View>
            <View style={styles.statBox}><Text style={[styles.statValue, {color: colors.primary}]}>{bestStreak}</Text><Text style={styles.statLabel}>Recorde</Text></View>
            <View style={styles.statBox}><Text style={[styles.statValue, {color: colors.primary}]}>{successRate}%</Text><Text style={styles.statLabel}>Sucesso</Text></View>
          </View>
          <View style={styles.calendarContainer}><CalendarList current={dayjs().format('YYYY-MM-DD')} markedDates={markedDates} theme={calendarTheme} horizontal={true} pagingEnabled={true} /></View>

          {entriesWithNotesOrPhotos.length > 0 && (
            <View style={styles.journalContainer}>
              <Text style={styles.journalTitle}>Diário</Text>
              {entriesWithNotesOrPhotos.map(([date, data]) => (
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

  const styles = getStyles(colors);

  return (
    <LinearGradient colors={colors.background} style={styles.container}>
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

const getCalendarTheme = (colors) => ({
  calendarBackground: 'transparent', textSectionTitleColor: colors.subtext,
  selectedDayBackgroundColor: colors.accent, selectedDayTextColor: '#ffffff',
  todayTextColor: colors.primary, dayTextColor: colors.text, arrowColor: colors.primary,
  monthTextColor: colors.text, textMonthFontWeight: 'bold',
});

const getStyles = (colors) => StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.text, textAlign: 'center', marginVertical: 20, marginTop: 50 },
  listContentContainer: { paddingHorizontal: 10, paddingBottom: 20 },
  habitCard: { borderRadius: 15, padding: 20, marginVertical: 10, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  habitName: { fontSize: 22, fontWeight: 'bold', color: colors.text, marginBottom: 15 },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 15, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.locked, paddingVertical: 15 },
  statBox: { alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: 'bold' },
  statLabel: { fontSize: 14, color: colors.subtext, marginTop: 4 },
  calendarContainer: { borderRadius: 10, overflow: 'hidden', marginBottom: 15 },
  journalContainer: { marginTop: 10, borderTopWidth: 1, borderColor: colors.locked, paddingTop: 15 },
  journalTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 10 },
  journalEntry: { marginBottom: 15, backgroundColor: colors.background[0], padding: 10, borderRadius: 10 },
  journalDate: { fontSize: 14, fontWeight: '600', color: colors.subtext, marginBottom: 8 },
  photo: { width: '100%', height: 150, borderRadius: 8, marginBottom: 8 },
  noteText: { fontStyle: 'italic', color: colors.text },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { fontSize: 18, color: colors.subtext, opacity: 0.8 },
});