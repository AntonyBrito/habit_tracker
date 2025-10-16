import React, { useState, useCallback, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { ACHIEVEMENTS, JOURNEYS } from '../data/gamification';
import { getUnlockedAchievements } from '../data/AchievementManager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../data/ThemeContext';

export default function AchievementsScreen({ navigation }) {
  const { colors } = useContext(ThemeContext);
  const [activeTab, setActiveTab] = useState('achievements');
  const [unlockedAchievements, setUnlockedAchievements] = useState([]);

  useFocusEffect(
    useCallback(() => {
      const loadUnlocked = async () => {
        const unlocked = await getUnlockedAchievements();
        setUnlockedAchievements(unlocked);
      };
      loadUnlocked();
    }, [])
  );

  const startJourney = async (journey) => {
    Alert.alert(
      `Iniciar Jornada: ${journey.title}`,
      "Isso adicionará novos hábitos à sua lista. Deseja continuar?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Iniciar", onPress: async () => {
            const existingHabits = JSON.parse(await AsyncStorage.getItem('habits') || '[]');
            const newHabits = journey.habits.map(h => ({
              id: `${journey.id}_${Date.now()}_${Math.random()}`, name: h.name, createdAt: new Date().toISOString(),
              frequency: { type: 'daily' }, goal: h.goal, completed: {},
            }));
            await AsyncStorage.setItem('habits', JSON.stringify([...existingHabits, ...newHabits]));
            Alert.alert("Jornada Iniciada!", "Novos hábitos foram adicionados à sua lista.");
            navigation.navigate('HabitList');
          }
        }
      ]
    );
  };

  const renderAchievementItem = ({ item }) => {
    const isUnlocked = unlockedAchievements.includes(item.id);
    const styles = getStyles(colors);
    return (
      <View style={[styles.itemCard, !isUnlocked && { backgroundColor: colors.locked }]}>
        <Feather name={item.icon} size={40} color={isUnlocked ? '#FFC107' : colors.subtext} />
        <View style={styles.itemDetails}>
          <Text style={[styles.itemTitle, !isUnlocked && { color: colors.subtext }]}>{item.title}</Text>
          <Text style={[styles.itemDescription, !isUnlocked && { color: colors.subtext }]}>{item.description}</Text>
        </View>
      </View>
    );
  };

  const renderJourneyItem = ({ item }) => {
    const styles = getStyles(colors);
    return (
      <View style={styles.itemCard}>
        <Feather name={item.icon} size={40} color={colors.primary} />
        <View style={styles.itemDetails}>
          <Text style={styles.itemTitle}>{item.title}</Text>
          <Text style={styles.itemDescription}>{item.description}</Text>
        </View>
        <TouchableOpacity style={[styles.startButton, {backgroundColor: colors.primary}]} onPress={() => startJourney(item)}>
          <Text style={styles.startButtonText}>Iniciar</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const styles = getStyles(colors);

  return (
    <LinearGradient colors={colors.background} style={styles.container}>
      <Text style={styles.title}>Conquistas & Jornadas</Text>
      <View style={[styles.tabContainer, {backgroundColor: colors.card[1]}]}>
        <TouchableOpacity onPress={() => setActiveTab('achievements')} style={[styles.tab, activeTab === 'achievements' && {backgroundColor: colors.card[0]}]}>
          <Text style={[styles.tabText, activeTab === 'achievements' && {color: colors.primary}]}>Conquistas</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('journeys')} style={[styles.tab, activeTab === 'journeys' && {backgroundColor: colors.card[0]}]}>
          <Text style={[styles.tabText, activeTab === 'journeys' && {color: colors.primary}]}>Jornadas</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'achievements' ? (
        <FlatList data={Object.values(ACHIEVEMENTS)} renderItem={renderAchievementItem} keyExtractor={item => item.id} contentContainerStyle={styles.listContentContainer} />
      ) : (
        <FlatList data={JOURNEYS} renderItem={renderJourneyItem} keyExtractor={item => item.id} contentContainerStyle={styles.listContentContainer} />
      )}
    </LinearGradient>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.text, textAlign: 'center', marginVertical: 20, marginTop: 50 },
  tabContainer: { flexDirection: 'row', justifyContent: 'center', marginHorizontal: 20, marginBottom: 20, borderRadius: 15 },
  tab: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 15, flex: 1, alignItems: 'center' },
  tabText: { color: colors.subtext, fontWeight: 'bold' },
  listContentContainer: { paddingHorizontal: 10, paddingBottom: 20 },
  itemCard: { backgroundColor: colors.card[0], borderRadius: 15, padding: 20, marginVertical: 8, flexDirection: 'row', alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1 },
  itemDetails: { flex: 1, marginLeft: 20 },
  itemTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  itemDescription: { fontSize: 14, color: colors.subtext, marginTop: 4 },
  startButton: { paddingVertical: 8, paddingHorizontal: 15, borderRadius: 10 },
  startButtonText: { color: '#fff', fontWeight: 'bold' },
});