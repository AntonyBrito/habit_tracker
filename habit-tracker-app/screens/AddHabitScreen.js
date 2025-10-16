import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, Switch, Platform, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Feather } from '@expo/vector-icons';

export default function AddHabitScreen({ navigation }) {
  const [habitName, setHabitName] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState(new Date(new Date().setHours(9, 0, 0, 0)));
  const [showTimePicker, setShowTimePicker] = useState(false);

  const scheduleNotification = async (habitName) => {
    const trigger = new Date(reminderTime);
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
      <Text style={styles.label}>Qual hábito você quer criar?</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex: Ler 10 páginas de um livro"
        value={habitName}
        onChangeText={setHabitName}
      />

      <View style={styles.card}>
        <View style={styles.switchContainer}>
          <Feather name="bell" size={24} color="#5856D6" />
          <Text style={styles.cardLabel}>Ativar Lembretes</Text>
          <Switch
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={notificationsEnabled ? '#5856D6' : '#f4f3f4'}
            ios_backgroundColor="#3e3e3e"
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
          />
        </View>

        {notificationsEnabled && (
          <View style={styles.timePickerContainer}>
            <TouchableOpacity onPress={() => setShowTimePicker(true)} style={styles.timeButton}>
              <Text style={styles.timeButtonText}>
                Lembrar às: {reminderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

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

      <View style={styles.saveButtonContainer}>
        <Button title="Salvar Hábito" onPress={saveHabit} color="#007AFF" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f0f2f5',
  },
  label: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
    borderRadius: 10,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardLabel: {
    flex: 1,
    marginLeft: 15,
    fontSize: 18,
    color: '#333'
  },
  timePickerContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  timeButton: {
    backgroundColor: '#eef2ff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  timeButtonText: {
    color: '#5856D6',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonContainer: {
    marginTop: 'auto',
    paddingBottom: 20,
  },
});