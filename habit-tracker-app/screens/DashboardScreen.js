import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { PieChart } from 'react-native-chart-kit';
import { CalendarList } from 'react-native-calendars';
import dayjs from 'dayjs';
import { LinearGradient } from 'expo-linear-gradient';

const screenWidth = Dimensions.get('window').width;

const chartConfig = {
  backgroundGradientFrom: "#1E2923",
  backgroundGradientFromOpacity: 0,
  backgroundGradientTo: "#08130D",
  backgroundGradientToOpacity: 0.5,
  color: (opacity = 1) => `rgba(26, 255, 146, ${opacity})`,
  strokeWidth: 2,
  barPercentage: 0.5,
  useShadowsForDottedLines: true,
};

export default function DashboardScreen() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  const processDataForDashboard = (allHabits) => {
    if (!allHabits || allHabits.length === 0) {
        setDashboardData({
            totalSuccessRate: 0,
            pieChartData: [{ name: 'Nenhum Hábito', population: 1, color: '#E5E7EB', legendFontColor: "#7F7F7F", legendFontSize: 15 }],
            heatmapData: {},
            topHabits: []
        });
        setLoading(false);
        return;
    }

    let totalCompleted = 0;
    let totalPossibleDays = 0;
    const dailyActivity = {};
    const habitStreaks = [];

    allHabits.forEach(habit => {
      const completedDates = Object.keys(habit.completed || {});
      totalCompleted += completedDates.length;
      totalPossibleDays += dayjs().diff(dayjs(habit.createdAt), 'day') + 1;

      completedDates.forEach(date => {
        dailyActivity[date] = (dailyActivity[date] || 0) + 1;
      });

      // Simple streak calculation for ranking
      const sortedDates = completedDates.sort();
      let bestStreak = 0;
      let currentStreak = 0;
      if (sortedDates.length > 0) bestStreak = 1;
      for (let i = 1; i < sortedDates.length; i++) {
        if (dayjs(sortedDates[i]).diff(dayjs(sortedDates[i - 1]), 'day') === 1) {
          currentStreak++;
        } else {
          currentStreak = 1;
        }
        if (currentStreak > bestStreak) bestStreak = currentStreak;
      }
      habitStreaks.push({ name: habit.name, streak: bestStreak });
    });

    const totalSuccessRate = totalPossibleDays > 0 ? (totalCompleted / totalPossibleDays) : 0;

    const pieChartData = [
      { name: "Sucesso", population: totalCompleted, color: "#10B981", legendFontColor: "#1F2937", legendFontSize: 15 },
      { name: "Falha", population: totalPossibleDays - totalCompleted, color: "#EF4444", legendFontColor: "#1F2937", legendFontSize: 15 },
    ];

    const heatmapData = Object.keys(dailyActivity).reduce((acc, date) => {
      const intensity = Math.min(dailyActivity[date] / 5, 1); // Normalize intensity (cap at 5 habits/day for max color)
      acc[date] = {
        startingDay: true, endingDay: true,
        color: `rgba(74, 0, 224, ${intensity})`,
      };
      return acc;
    }, {});

    const topHabits = habitStreaks.sort((a, b) => b.streak - a.streak).slice(0, 3);

    setDashboardData({ totalSuccessRate, pieChartData, heatmapData, topHabits });
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      const fetchAndProcessData = async () => {
        try {
          setLoading(true);
          const storedHabits = await AsyncStorage.getItem('habits');
          const allHabits = storedHabits ? JSON.parse(storedHabits) : [];
          processDataForDashboard(allHabits);
        } catch (error) {
          console.error(error);
          Alert.alert('Erro', 'Não foi possível carregar os dados do dashboard.');
          setLoading(false);
        }
      };
      fetchAndProcessData();
    }, [])
  );

  if (loading || !dashboardData) {
    return (
      <LinearGradient colors={['#8E2DE2', '#4A00E0']} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Calculando seus insights...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#8E2DE2', '#4A00E0']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Text style={styles.title}>Seu Dashboard</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Taxa de Sucesso Geral</Text>
          <PieChart data={dashboardData.pieChartData} width={screenWidth - 60} height={220} chartConfig={chartConfig} accessor={"population"} backgroundColor={"transparent"} paddingLeft={"15"} absolute />
        </View>

        <View style={styles.card}>
            <Text style={styles.cardTitle}>Hábitos em Destaque (Melhor Sequência)</Text>
            {dashboardData.topHabits.map((habit, index) => (
                <Text key={index} style={styles.habitRank}>{index + 1}. {habit.name} ({habit.streak} dias)</Text>
            ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Mapa de Atividades</Text>
          <CalendarList
            markingType="period"
            markedDates={dashboardData.heatmapData}
            horizontal={true}
            pagingEnabled={true}
            theme={{ calendarBackground: 'transparent' }}
          />
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  contentContainer: { padding: 15, paddingTop: 50, paddingBottom: 30 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 20 },
  card: { backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: 15, padding: 20, marginBottom: 20, elevation: 5 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  loadingText: { color: '#fff', fontSize: 18, textAlign: 'center', marginTop: 10 },
  habitRank: { fontSize: 16, color: '#4B5563', paddingVertical: 5 },
});