import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, Button, TouchableOpacity,
  Alert, Image, LayoutAnimation, UIManager, Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function HabitListScreen({ navigation }) {
  const [habits, setHabits] = useState([]);

  const fetchHabits = async () => {
    try {
      const storedHabits = await AsyncStorage.getItem('habits');
      setHabits(storedHabits ? JSON.parse(storedHabits) : []);
    } catch (error) {
      console.error(error);
    }
  };

  useFocusEffect(useCallback(() => { fetchHabits(); }, []));

  const updateHabitsInStorage = async (updatedHabits) => {
    setHabits(updatedHabits);
    await AsyncStorage.setItem('habits', JSON.stringify(updatedHabits));
  };

  const takePhoto = async (habitId) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão Negada', 'Você precisa permitir o acesso à câmera.');
      return;
    }

    let result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [4, 3], quality: 0.5 });
    if (!result.canceled) {
      markHabitCompleted(habitId, result.assets[0].uri);
    }
  };

  const markHabitCompleted = (habitId, photoUri = null) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const today = new Date().toISOString().slice(0, 10);
    const updatedHabits = habits.map(habit => {
      if (habit.id === habitId) {
        const newCompleted = { ...habit.completed, [today]: { done: true, photoUri } };
        return { ...habit, completed: newCompleted };
      }
      return habit;
    });
    updateHabitsInStorage(updatedHabits);
  };

  const unmarkHabitCompleted = (habitId) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const today = new Date().toISOString().slice(0, 10);
    const updatedHabits = habits.map(habit => {
      if (habit.id === habitId) {
        const newCompleted = { ...habit.completed };
        delete newCompleted[today];
        return { ...habit, completed: newCompleted };
      }
      return habit;
    });
    updateHabitsInStorage(updatedHabits);
  }

  const deleteHabit = async (habitId) => {
    const habitToDelete = habits.find(h => h.id === habitId);
    if (habitToDelete?.notificationId) {
      await Notifications.cancelScheduledNotificationAsync(habitToDelete.notificationId);
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const updatedHabits = habits.filter(h => h.id !== habitId);
    updateHabitsInStorage(updatedHabits);
  };

  const confirmDeleteHabit = (habitId) => {
    Alert.alert('Remover Hábito', 'Tem certeza?',
      [{ text: 'Cancelar' }, { text: 'Remover', onPress: () => deleteHabit(habitId), style: 'destructive' }],
    );
  };

  const renderItem = ({ item }) => {
    const today = new Date().toISOString().slice(0, 10);
    const completionData = item.completed?.[today];
    const isCompletedToday = completionData?.done;

    return (
      <View style={styles.habitCard}>
        <View style={styles.habitHeader}>
          <Text style={styles.habitName}>{item.name}</Text>
          <View style={styles.actionsContainer}>
            <TouchableOpacity onPress={() => navigation.navigate('EditHabit', { habitId: item.id })} style={styles.iconButton}>
              <Feather name="edit-2" size={20} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => confirmDeleteHabit(item.id)} style={styles.iconButton}>
              <Feather name="trash-2" size={20} color="#E53935" />
            </TouchableOpacity>
          </View>
        </View>

        {isCompletedToday && completionData.photoUri && (
          <Image source={{ uri: completionData.photoUri }} style={styles.photo} />
        )}

        <View style={styles.habitFooter}>
          {isCompletedToday ? (
            <TouchableOpacity style={[styles.statusButton, styles.completedButton]} onPress={() => unmarkHabitCompleted(item.id)}>
              <Feather name="check-circle" size={20} color="white" />
              <Text style={styles.statusButtonText}>Feito!</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.completionActions}>
              <TouchableOpacity style={[styles.statusButton, styles.incompleteButton]} onPress={() => markHabitCompleted(item.id)}>
                <Feather name="circle" size={20} color="white" />
                <Text style={styles.statusButtonText}>Marcar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cameraButton} onPress={() => takePhoto(item.id)}>
                <Feather name="camera" size={20} color="white" />
                <Text style={styles.statusButtonText}>Foto</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={habits}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<View style={styles.emptyContainer}><Text style={styles.emptyText}>Crie seu primeiro hábito!</Text></View>}
        contentContainerStyle={styles.listContentContainer}
      />
      <View style={styles.addButtonContainer}>
        <Button title="+ Adicionar Novo Hábito" onPress={() => navigation.navigate('AddHabit')} color="#007AFF" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  listContentContainer: { padding: 10, paddingBottom: 80 },
  habitCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    marginVertical: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  habitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  habitName: { fontSize: 18, fontWeight: '600', color: '#333', flex: 1 },
  actionsContainer: { flexDirection: 'row' },
  iconButton: { marginLeft: 15, padding: 5 },
  photo: { width: '100%', height: 200, borderRadius: 8, marginVertical: 10 },
  habitFooter: { marginTop: 10 },
  completionActions: { flexDirection: 'row', justifyContent: 'space-between' },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    flex: 1,
  },
  completedButton: { backgroundColor: '#34C759' },
  incompleteButton: { backgroundColor: '#007AFF', marginRight: 10 },
  cameraButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    backgroundColor: '#5856D6',
    flex: 1,
  },
  statusButtonText: { color: 'white', fontWeight: 'bold', marginLeft: 8 },
  emptyContainer: { alignItems: 'center', marginTop: 50 },
  emptyText: { fontSize: 18, color: '#888' },
  addButtonContainer: {
    padding: 15,
    backgroundColor: '#f0f2f5',
    borderTopWidth: 1,
    borderColor: '#ddd',
  },
});