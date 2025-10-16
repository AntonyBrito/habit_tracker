import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, Switch, Platform, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

export default function EditHabitScreen({ route, navigation }) {
  const { habitId } = route.params;
  const [habitName, setHabitName] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [originalHabit, setOriginalHabit] = useState(null);

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
        }
      } catch (e) { console.error(e); }
    };
    loadHabit();
  }, [habitId]);

  const scheduleNotification = async (name) => {
    const trigger = new Date(reminderTime);
    return await Notifications.scheduleNotificationAsync({
      content: { title: "Lembrete de Hábito!", body: `Não se esqueça de: ${name}` },
      trigger: { hour: trigger.getHours(), minute: trigger.getMinutes(), repeats: true },
    });
  };

  const saveHabit = async () => {
    if (habitName.trim() === '') {
      Alert.alert('Erro', 'O nome do hábito não pode ficar em branco.');
      return;
    }
    try {
      if (originalHabit?.notificationId) {
        await Notifications.cancelScheduledNotificationAsync(originalHabit.notificationId);
      }
      const newNotificationId = notificationsEnabled ? await scheduleNotification(habitName) : null;

      const existingHabits = JSON.parse(await AsyncStorage.getItem('habits') || '[]');
      const updatedHabits = existingHabits.map(h =>
        h.id === habitId
          ? { ...h, name: habitName, notificationId: newNotificationId, reminderTime: reminderTime.toISOString() }
          : h
      );

      await AsyncStorage.setItem('habits', JSON.stringify(updatedHabits));
      navigation.goBack();
    } catch (e) {
      console.error(e);
      Alert.alert('Erro', 'Não foi possível salvar as alterações.');
    }
  };

  const onTimeChange = (event, selectedDate) => {
    setShowTimePicker(Platform.OS === 'ios');
    if(selectedDate) setReminderTime(selectedDate);
  };

  return (
    <LinearGradient colors={['#8E2DE2', '#4A00E0']} style={styles.container}>
      <Text style={styles.label}>Editando Hábito</Text>
      <TextInput style={styles.input} value={habitName} onChangeText={setHabitName} placeholderTextColor="#ccc" />

      <View style={styles.card}>
        <View style={styles.switchContainer}>
          <Feather name="bell" size={24} color="#fff" />
          <Text style={styles.cardLabel}>Ativar Lembretes</Text>
          <Switch
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={notificationsEnabled ? '#f5dd4b' : '#f4f3f4'}
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
          />
        </View>

        {notificationsEnabled && (
          <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(300)}>
            <TouchableOpacity onPress={() => setShowTimePicker(true)} style={styles.timeButton}>
              <Text style={styles.timeButtonText}>
                Lembrar às: {reminderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>

      {showTimePicker && (
        <DateTimePicker value={reminderTime} mode="time" is24Hour={true} display="spinner" onChange={onTimeChange} textColor="#fff" />
      )}

      <TouchableOpacity onPress={saveHabit}>
        <LinearGradient colors={['#34D399', '#2DD4BF']} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Salvar Alterações</Text>
        </LinearGradient>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  label: { fontSize: 28, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 30 },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 20, fontSize: 18, marginBottom: 20,
    borderRadius: 15, color: '#fff', borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15, padding: 20, marginBottom: 20,
  },
  switchContainer: { flexDirection: 'row', alignItems: 'center' },
  cardLabel: { flex: 1, marginLeft: 15, fontSize: 18, color: '#fff' },
  timeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 12, paddingHorizontal: 20,
    borderRadius: 10, marginTop: 20, alignItems: 'center',
  },
  timeButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  saveButton: { padding: 20, borderRadius: 15, alignItems: 'center', marginTop: 20 },
  saveButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});