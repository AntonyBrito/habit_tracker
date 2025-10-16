import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, Switch, Platform, TouchableOpacity, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';

const WEEK_DAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

const NumberSelector = ({ title, value, onValueChange }) => (
  <View style={styles.numberSelectorContainer}>
    <Text style={styles.detailText}>{title}</Text>
    <View style={styles.numberSelector}>
      <TouchableOpacity onPress={() => onValueChange(Math.max(1, value - 1))} style={styles.selectorButton}><Feather name="minus" size={20} color="#fff" /></TouchableOpacity>
      <Text style={styles.selectorValue}>{value}</Text>
      <TouchableOpacity onPress={() => onValueChange(value + 1)} style={styles.selectorButton}><Feather name="plus" size={20} color="#fff" /></TouchableOpacity>
    </View>
  </View>
);

export default function AddHabitScreen({ navigation }) {
  const [habitName, setHabitName] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState(new Date(new Date().setHours(9, 0, 0, 0)));
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [frequencyType, setFrequencyType] = useState('daily');
  const [weeklyCount, setWeeklyCount] = useState(3);
  const [specificDays, setSpecificDays] = useState([]);
  const [dailyGoal, setDailyGoal] = useState(1);

  const scheduleNotification = async (name, frequency) => {
    const trigger = new Date(reminderTime);
    let notificationTrigger = {};

    switch (frequency.type) {
      case 'daily':
        notificationTrigger = { hour: trigger.getHours(), minute: trigger.getMinutes(), repeats: true };
        break;
      case 'specificDays':
        // For specific days, we schedule a weekly notification for each selected day
        // weekday is 1-7 (Sun-Sat)
        frequency.specificDays.forEach(day => {
          Notifications.scheduleNotificationAsync({
            content: { title: "Lembrete de Hábito!", body: `Não se esqueça de: ${name}` },
            trigger: { weekday: day + 1, hour: trigger.getHours(), minute: trigger.getMinutes(), repeats: true },
          });
        });
        // We return a placeholder ID, as multiple notifications are scheduled.
        // A more robust solution would store all IDs.
        return "multiple-scheduled";
      case 'weekly':
        // For weekly, we'll just remind daily for now as the logic is complex.
        notificationTrigger = { hour: trigger.getHours(), minute: trigger.getMinutes(), repeats: true };
        break;
    }

    if (Object.keys(notificationTrigger).length === 0) return null;

    return await Notifications.scheduleNotificationAsync({
      content: { title: "Lembrete de Hábito!", body: `Não se esqueça de: ${name}` },
      trigger: notificationTrigger,
    });
  };

  const saveHabit = async () => {
    if (habitName.trim() === '') return Alert.alert('Erro', 'Por favor, insira um nome para o hábito.');
    let notificationId = null;
    if (notificationsEnabled) {
      try {
        const frequency = { type: frequencyType, weeklyCount, specificDays };
        notificationId = await scheduleNotification(habitName, frequency);
      } catch (e) {
        console.error("Failed to schedule notification:", e);
        Alert.alert("Aviso", "Não foi possível agendar o lembrete, mas o hábito foi salvo.");
      }
    }
    try {
      const newHabit = {
        id: Date.now().toString(), name: habitName, createdAt: new Date().toISOString(),
        frequency: { type: frequencyType, weeklyCount: frequencyType === 'weekly' ? weeklyCount : null, specificDays: frequencyType === 'specificDays' ? specificDays : null },
        goal: { type: dailyGoal > 1 ? 'count' : 'check', target: dailyGoal },
        completed: {}, notificationId, reminderTime: reminderTime.toISOString(),
      };
      const habits = JSON.parse(await AsyncStorage.getItem('habits') || '[]');
      habits.push(newHabit);
      await AsyncStorage.setItem('habits', JSON.stringify(habits));
      navigation.navigate('HabitList');
    } catch (error) {
      console.error("Failed to save habit:", error);
      Alert.alert('Erro', 'Não foi possível salvar o hábito.');
    }
  };

  const onTimeChange = (event, selectedDate) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedDate) setReminderTime(selectedDate);
  };

  const toggleSpecificDay = (dayIndex) => setSpecificDays(prev => prev.includes(dayIndex) ? prev.filter(d => d !== dayIndex) : [...prev, dayIndex]);

  return (
    <LinearGradient colors={['#8E2DE2', '#4A00E0']} style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 50 }}>
        <Text style={styles.label}>Novo Hábito</Text>
        <TextInput style={styles.input} placeholder="Ex: Meditar por 10 minutos" placeholderTextColor="#ccc" value={habitName} onChangeText={setHabitName} />

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Frequência</Text>
          <View style={styles.pillsContainer}>
            <TouchableOpacity onPress={() => setFrequencyType('daily')}><Text style={[styles.pill, frequencyType === 'daily' && styles.pillActive]}>Diariamente</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setFrequencyType('weekly')}><Text style={[styles.pill, frequencyType === 'weekly' && styles.pillActive]}>Semanalmente</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setFrequencyType('specificDays')}><Text style={[styles.pill, frequencyType === 'specificDays' && styles.pillActive]}>Dias Específicos</Text></TouchableOpacity>
          </View>

          {frequencyType === 'weekly' && <NumberSelector title="Vezes por semana:" value={weeklyCount} onValueChange={setWeeklyCount} />}
          {frequencyType === 'specificDays' && (
            <View style={styles.weekContainer}>
              {WEEK_DAYS.map((day, index) => (
                <TouchableOpacity key={index} onPress={() => toggleSpecificDay(index)} style={[styles.dayPill, specificDays.includes(index) && styles.dayPillActive]}>
                  <Text style={[styles.dayPillText, specificDays.includes(index) && styles.dayPillTextActive]}>{day}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.card}>
            <NumberSelector title="Meta diária (1 = check simples):" value={dailyGoal} onValueChange={setDailyGoal} />
        </View>

        <View style={styles.card}>
          <View style={styles.switchContainer}>
            <Feather name="bell" size={24} color="#fff" />
            <Text style={styles.cardLabel}>Ativar Lembretes</Text>
            <Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} trackColor={{ false: '#767577', true: '#81b0ff' }} thumbColor={notificationsEnabled ? '#f5dd4b' : '#f4f3f4'} />
          </View>
          {notificationsEnabled && (
            <Animated.View entering={FadeIn.duration(300)}>
              <TouchableOpacity onPress={() => setShowTimePicker(true)} style={styles.timeButton}>
                <Text style={styles.timeButtonText}>Lembrar às: {reminderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>

        {showTimePicker && <DateTimePicker value={reminderTime} mode="time" is24Hour={true} display="spinner" onChange={onTimeChange} textColor="#fff" />}

        <TouchableOpacity onPress={saveHabit}>
          <LinearGradient colors={['#34D399', '#2DD4BF']} style={styles.saveButton}><Text style={styles.saveButtonText}>Salvar Hábito</Text></LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    label: { fontSize: 28, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 20, marginTop: 30 },
    input: { backgroundColor: 'rgba(255, 255, 255, 0.2)', padding: 20, fontSize: 18, marginBottom: 20, borderRadius: 15, color: '#fff', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.3)' },
    card: { backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: 15, padding: 20, marginBottom: 20 },
    cardTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 15 },
    pillsContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 10 },
    pill: { color: '#eee', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 15, borderWidth: 1, borderColor: 'transparent' },
    pillActive: { color: '#fff', borderColor: '#fff', backgroundColor: 'rgba(255,255,255,0.2)' },
    detailText: { color: '#eee', fontSize: 16, flex: 1 },
    weekContainer: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 15 },
    dayPill: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#aaa' },
    dayPillActive: { backgroundColor: '#fff', borderColor: 'transparent' },
    dayPillText: { color: '#fff' },
    dayPillTextActive: { color: '#4A00E0' },
    switchContainer: { flexDirection: 'row', alignItems: 'center' },
    cardLabel: { flex: 1, marginLeft: 15, fontSize: 18, color: '#fff' },
    timeButton: { backgroundColor: 'rgba(255, 255, 255, 0.2)', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10, marginTop: 20, alignItems: 'center' },
    timeButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    saveButton: { padding: 20, borderRadius: 15, alignItems: 'center', marginTop: 20 },
    saveButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    numberSelectorContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
    numberSelector: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 10 },
    selectorButton: { padding: 10 },
    selectorValue: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginHorizontal: 15 },
});