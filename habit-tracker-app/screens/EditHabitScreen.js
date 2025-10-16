import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, Switch, Platform, TouchableOpacity, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';
import { ThemeContext } from '../data/ThemeContext';

const WEEK_DAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

const NumberSelector = ({ title, value, onValueChange, colors }) => (
  <View style={getStyles(colors).numberSelectorContainer}>
    <Text style={[getStyles(colors).detailText, { color: colors.subtext }]}>{title}</Text>
    <View style={getStyles(colors).numberSelector}>
      <TouchableOpacity onPress={() => onValueChange(Math.max(1, value - 1))} style={getStyles(colors).selectorButton}><Feather name="minus" size={20} color={colors.text} /></TouchableOpacity>
      <Text style={[getStyles(colors).selectorValue, { color: colors.text }]}>{value}</Text>
      <TouchableOpacity onPress={() => onValueChange(value + 1)} style={getStyles(colors).selectorButton}><Feather name="plus" size={20} color={colors.text} /></TouchableOpacity>
    </View>
  </View>
);

export default function EditHabitScreen({ route, navigation }) {
  const { colors } = useContext(ThemeContext);
  const { habitId } = route.params;
  const [originalHabit, setOriginalHabit] = useState(null);
  const [habitName, setHabitName] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [frequencyType, setFrequencyType] = useState('daily');
  const [weeklyCount, setWeeklyCount] = useState(3);
  const [specificDays, setSpecificDays] = useState([]);
  const [dailyGoal, setDailyGoal] = useState(1);

  useEffect(() => {
    const loadHabit = async () => {
      try {
        const habits = JSON.parse(await AsyncStorage.getItem('habits') || '[]');
        const habitToEdit = habits.find(h => h.id === habitId);
        if (habitToEdit) {
          setOriginalHabit(habitToEdit);
          setHabitName(habitToEdit.name);
          setNotificationsEnabled(!!habitToEdit.notificationId);
          setReminderTime(habitToEdit.reminderTime ? new Date(habitToEdit.reminderTime) : new Date());
          setFrequencyType(habitToEdit.frequency.type);
          setWeeklyCount(habitToEdit.frequency.weeklyCount || 3);
          setSpecificDays(habitToEdit.frequency.specificDays || []);
          setDailyGoal(habitToEdit.goal.target || 1);
        }
      } catch (e) { console.error(e); }
    };
    loadHabit();
  }, [habitId]);

  const scheduleNotification = async (name, frequency) => {
    // ... (logic remains the same)
  };

  const saveHabit = async () => {
    // ... (logic remains the same)
  };

  const onTimeChange = (event, selectedDate) => {
    setShowTimePicker(Platform.OS === 'ios');
    if(selectedDate) setReminderTime(selectedDate);
  };

  const toggleSpecificDay = (dayIndex) => setSpecificDays(prev => prev.includes(dayIndex) ? prev.filter(d => d !== dayIndex) : [...prev, dayIndex]);

  const styles = getStyles(colors);

  return (
    <LinearGradient colors={colors.background} style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 50 }}>
        <Text style={styles.label}>Editando Hábito</Text>
        <TextInput style={styles.input} value={habitName} onChangeText={setHabitName} placeholderTextColor={colors.subtext} />

        <View style={[styles.card, {backgroundColor: colors.card[1]}]}>
          <Text style={styles.cardTitle}>Frequência</Text>
          <View style={styles.pillsContainer}>
            <TouchableOpacity onPress={() => setFrequencyType('daily')}><Text style={[styles.pill, frequencyType === 'daily' && styles.pillActive]}>Diariamente</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setFrequencyType('weekly')}><Text style={[styles.pill, frequencyType === 'weekly' && styles.pillActive]}>Semanalmente</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setFrequencyType('specificDays')}><Text style={[styles.pill, frequencyType === 'specificDays' && styles.pillActive]}>Dias Específicos</Text></TouchableOpacity>
          </View>
          {frequencyType === 'weekly' && <NumberSelector title="Vezes por semana:" value={weeklyCount} onValueChange={setWeeklyCount} colors={colors} />}
          {frequencyType === 'specificDays' && (
            <View style={styles.weekContainer}>
              {WEEK_DAYS.map((day, index) => (
                <TouchableOpacity key={index} onPress={() => toggleSpecificDay(index)} style={[styles.dayPill, {borderColor: colors.subtext}, specificDays.includes(index) && {backgroundColor: colors.text, borderColor: colors.text}]}>
                  <Text style={[styles.dayPillText, {color: colors.text}, specificDays.includes(index) && {color: colors.card[0]}]}>{day}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={[styles.card, {backgroundColor: colors.card[1]}]}>
          <NumberSelector title="Meta diária (1 = check simples):" value={dailyGoal} onValueChange={setDailyGoal} colors={colors} />
        </View>

        <View style={[styles.card, {backgroundColor: colors.card[1]}]}>
          <View style={styles.switchContainer}>
            <Feather name="bell" size={24} color={colors.primary} />
            <Text style={styles.cardLabel}>Ativar Lembretes</Text>
            <Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} trackColor={{ false: colors.locked, true: colors.primary }} thumbColor={colors.accent} />
          </View>
          {notificationsEnabled && (
            <Animated.View entering={FadeIn.duration(300)}>
              <TouchableOpacity onPress={() => setShowTimePicker(true)} style={styles.timeButton}>
                <Text style={[styles.timeButtonText, {color: colors.primary}]}>Lembrar às: {reminderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>

        {showTimePicker && <DateTimePicker value={reminderTime} mode="time" is24Hour={true} display="spinner" onChange={onTimeChange} />}

        <TouchableOpacity onPress={saveHabit}>
          <LinearGradient colors={[colors.accent, '#34D399']} style={styles.saveButton}><Text style={styles.saveButtonText}>Salvar Alterações</Text></LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const getStyles = (colors) => StyleSheet.create({
    container: { flex: 1 },
    label: { fontSize: 28, fontWeight: 'bold', color: colors.text, textAlign: 'center', marginBottom: 20, marginTop: 30 },
    input: { backgroundColor: colors.card[0], padding: 20, fontSize: 18, marginBottom: 20, borderRadius: 15, color: colors.text, borderWidth: 1, borderColor: colors.locked },
    card: { borderRadius: 15, padding: 20, marginBottom: 20 },
    cardTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginBottom: 15 },
    pillsContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 10 },
    pill: { color: colors.subtext, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 15, borderWidth: 1, borderColor: 'transparent' },
    pillActive: { color: colors.text, borderColor: colors.primary, backgroundColor: colors.primary+'30' },
    detailText: { color: colors.subtext, fontSize: 16, flex: 1 },
    weekContainer: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 15 },
    dayPill: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
    dayPillActive: {},
    dayPillText: {},
    dayPillTextActive: {},
    switchContainer: { flexDirection: 'row', alignItems: 'center' },
    cardLabel: { flex: 1, marginLeft: 15, fontSize: 18, color: colors.text },
    timeButton: { backgroundColor: colors.card[0], paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10, marginTop: 20, alignItems: 'center' },
    timeButtonText: { fontSize: 16, fontWeight: '600' },
    saveButton: { padding: 20, borderRadius: 15, alignItems: 'center', marginTop: 20 },
    saveButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    numberSelectorContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
    numberSelector: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card[0], borderRadius: 10 },
    selectorButton: { padding: 10 },
    selectorValue: { fontSize: 18, fontWeight: 'bold', marginHorizontal: 15 },
});