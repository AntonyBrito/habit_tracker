import React, { useState, useCallback, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { PieChart } from 'react-native-chart-kit';
import { CalendarList } from 'react-native-calendars';
import dayjs from 'dayjs';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { ThemeContext } from '../data/ThemeContext';

const screenWidth = Dimensions.get('window').width;

export default function DashboardScreen() {
  const { theme, toggleTheme, colors } = useContext(ThemeContext);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  const processDataForDashboard = (allHabits) => {
    // ... (logic remains the same)
    if (!allHabits || allHabits.length === 0) {
        setDashboardData({
            totalSuccessRate: 0,
            pieChartData: [{ name: 'Nenhum Hábito', population: 1, color: colors.locked, legendFontColor: colors.subtext, legendFontSize: 15 }],
            heatmapData: {}, topHabits: []
        });
        setLoading(false);
        return;
    }
    let totalCompleted = 0, totalPossibleDays = 0, dailyActivity = {}, habitStreaks = [];
    allHabits.forEach(habit => {
      const completedDates = Object.keys(habit.completed || {});
      totalCompleted += completedDates.length;
      totalPossibleDays += dayjs().diff(dayjs(habit.createdAt), 'day') + 1;
      completedDates.forEach(date => { dailyActivity[date] = (dailyActivity[date] || 0) + 1; });
      const sortedDates = completedDates.sort();
      let bestStreak = 0, currentStreak = 0;
      if (sortedDates.length > 0) bestStreak = 1;
      for (let i = 1; i < sortedDates.length; i++) {
        if (dayjs(sortedDates[i]).diff(dayjs(sortedDates[i - 1]), 'day') === 1) currentStreak++; else currentStreak = 1;
        if (currentStreak > bestStreak) bestStreak = currentStreak;
      }
      habitStreaks.push({ name: habit.name, streak: bestStreak });
    });
    const pieChartData = [
      { name: "Sucesso", population: totalCompleted, color: colors.accent, legendFontColor: colors.text, legendFontSize: 15 },
      { name: "Falha", population: totalPossibleDays - totalCompleted, color: colors.locked, legendFontColor: colors.text, legendFontSize: 15 },
    ];
    const heatmapData = Object.keys(dailyActivity).reduce((acc, date) => {
      const intensity = Math.min(dailyActivity[date] / 5, 1);
      acc[date] = { startingDay: true, endingDay: true, color: `rgba(142, 45, 226, ${intensity})` }; // Using a consistent purple
      return acc;
    }, {});
    const topHabits = habitStreaks.sort((a, b) => b.streak - a.streak).slice(0, 3);
    setDashboardData({ pieChartData, heatmapData, topHabits });
    setLoading(false);
  };

  useFocusEffect(useCallback(() => {
    const fetchAndProcessData = async () => {
      try {
        setLoading(true);
        const storedHabits = await AsyncStorage.getItem('habits');
        processDataForDashboard(storedHabits ? JSON.parse(storedHabits) : []);
      } catch (error) {
        console.error(error);
        Alert.alert('Erro', 'Não foi possível carregar os dados.');
        setLoading(false);
      }
    };
    fetchAndProcessData();
  }, []));

  const chartConfig = {
    color: (opacity = 1) => `rgba(26, 255, 146, ${opacity})`,
  };

  if (loading || !dashboardData) {
    return (
      <LinearGradient colors={colors.background} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={colors.background} style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Dashboard</Text>
            <TouchableOpacity onPress={toggleTheme} style={styles.themeButton}>
                <Feather name={theme === 'light' ? 'moon' : 'sun'} size={24} color={colors.text} />
            </TouchableOpacity>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card[0] }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Taxa de Sucesso Geral</Text>
          <PieChart data={dashboardData.pieChartData} width={screenWidth - 60} height={220} chartConfig={chartConfig} accessor={"population"} backgroundColor={"transparent"} paddingLeft={"15"} absolute />
        </View>

        <View style={[styles.card, { backgroundColor: colors.card[0] }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Hábitos em Destaque</Text>
            {dashboardData.topHabits.map((habit, index) => (
                <Text key={index} style={[styles.habitRank, { color: colors.subtext }]}>{index + 1}. {habit.name} ({habit.streak} dias)</Text>
            ))}
        </View>

        <View style={[styles.card, { backgroundColor: colors.card[0] }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Mapa de Atividades</Text>
          <CalendarList markingType="period" markedDates={dashboardData.heatmapData} horizontal={true} pagingEnabled={true} theme={{ calendarBackground: 'transparent', monthTextColor: colors.text, dayTextColor: colors.text, textSectionTitleColor: colors.subtext }}/>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  contentContainer: { padding: 15, paddingTop: 40, paddingBottom: 30 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 28, fontWeight: 'bold', flex: 1, textAlign: 'center', marginLeft: 30 },
  themeButton: { padding: 5 },
  card: { borderRadius: 15, padding: 20, marginBottom: 20, elevation: 5 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  habitRank: { fontSize: 16, paddingVertical: 5 },
});