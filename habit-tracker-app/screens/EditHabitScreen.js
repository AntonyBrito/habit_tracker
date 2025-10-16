import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, Switch, Platform, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Feather } from '@expo/vector-icons';

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
        const existingHabits = await AsyncStorage.getItem('habits');
        const habits = existingHabits ? JSON.parse(existingHabits) : [];
        const habitToEdit = habits.find(h => h.id === habitId);
        if (habitToEdit) {
          setOriginalHabit(habitToEdit);
          setHabitName(habitToEdit.name);
          setNotificationsEnabled(!!habitToEdit.notificationId);
          setReminderTime(habitToEdit.reminderTime ? new Date(habitToEdit.reminderTime) : new Date());
        }
      } catch (error) {
        console.error(error);
      }
    };
    loadHabit();
  }, [habitId]);

  const scheduleNotification = async (habitName) => {
    const trigger = new Date(reminderTime);
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: { title: "Lembrete de Hábito!", body: `Não se esqueça de completar seu hábito: ${habitName}` },
      trigger: { hour: trigger.getHours(), minute: trigger.getMinutes(), repeats: true },
    });
    return notificationId;
  };

  const saveHabit = async () => {
    if (habitName.trim() === '') {
      Alert.alert('Erro', 'O nome do hábito não pode ficar em branco.');
      return;
    }

    try {
      if (originalHabit && originalHabit.notificationId) {
        await Notifications.cancelScheduledNotificationAsync(originalHabit.notificationId);
      }

      let newNotificationId = null;
      if (notificationsEnabled) {
        newNotificationId = await scheduleNotification(habitName);
      }

      const existingHabits = await AsyncStorage.getItem('habits');
      let habits = existingHabits ? JSON.parse(existingHabits) : [];
      habits = habits.map(h => {
        if (h.id === habitId) {
          return {
            ...h,
            name: habitName,
            notificationId: newNotificationId,
            reminderTime: reminderTime.toISOString(),
          };
        }
        return h;
      });

      await AsyncStorage.setItem('habits', JSON.stringify(habits));
      Alert.alert('Sucesso', 'Hábito atualizado!');
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível salvar as alterações.');
    }
  };

  const onTimeChange = (event, selectedDate) => {
    const currentDate = selectedDate || reminderTime;
    setShowTimePicker(Platform.OS === 'ios');
    setReminderTime(currentDate);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Editando Hábito</Text>
      <TextInput style={styles.input} value={habitName} onChangeText={setHabitName} />

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
          value={reminderTime}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={onTimeChange}
        />
      )}

      <View style={styles.saveButtonContainer}>
        <Button title="Salvar Alterações" onPress={saveHabit} color="#007AFF" />
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