import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, Switch, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function AddHabitScreen({ navigation }) {
  const [habitName, setHabitName] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState(new Date(new Date().setHours(9, 0, 0, 0))); // Default 9:00 AM
  const [showTimePicker, setShowTimePicker] = useState(false);

  const scheduleNotification = async (habitName) => {
    const trigger = new Date(reminderTime);
    trigger.setSeconds(0);

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Lembrete de Hábito!",
        body: `Não se esqueça de completar seu hábito: ${habitName}`,
      },
      trigger: {
        hour: trigger.getHours(),
        minute: trigger.getMinutes(),
        repeats: true,
      },
    });
    return notificationId;
  };

  const saveHabit = async () => {
    if (habitName.trim() === '') {
      Alert.alert('Erro', 'Por favor, insira um nome para o hábito.');
      return;
    }

    try {
      let notificationId = null;
      if (notificationsEnabled) {
        notificationId = await scheduleNotification(habitName);
      }

      const newHabit = {
        id: Date.now().toString(),
        name: habitName,
        frequency: 'daily',
        completed: {},
        notificationId: notificationId,
        reminderTime: reminderTime.toISOString(),
      };

      const existingHabits = await AsyncStorage.getItem('habits');
      const habits = existingHabits ? JSON.parse(existingHabits) : [];
      habits.push(newHabit);

      await AsyncStorage.setItem('habits', JSON.stringify(habits));
      Alert.alert('Sucesso', 'Hábito salvo!');
      navigation.navigate('HabitList');
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível salvar o hábito.');
    }
  };

  const onTimeChange = (event, selectedDate) => {
    const currentDate = selectedDate || reminderTime;
    setShowTimePicker(Platform.OS === 'ios');
    setReminderTime(currentDate);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Nome do Hábito:</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex: Beber 2L de água"
        value={habitName}
        onChangeText={setHabitName}
      />

      <View style={styles.switchContainer}>
        <Text style={styles.label}>Ativar Lembretes?</Text>
        <Switch
          value={notificationsEnabled}
          onValueChange={setNotificationsEnabled}
        />
      </View>

      {notificationsEnabled && (
        <View>
          <Button onPress={() => setShowTimePicker(true)} title="Escolher Horário do Lembrete" />
          <Text style={styles.timeText}>Lembrete às: {reminderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
        </View>
      )}

      {showTimePicker && (
        <DateTimePicker
          testID="dateTimePicker"
          value={reminderTime}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={onTimeChange}
        />
      )}

      <View style={styles.saveButton}>
        <Button title="Salvar Hábito" onPress={saveHabit} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  label: { fontSize: 18, marginBottom: 10 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, fontSize: 16, marginBottom: 20, borderRadius: 5 },
  switchContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  timeText: { textAlign: 'center', fontSize: 16, marginVertical: 10 },
  saveButton: { marginTop: 20 },
});