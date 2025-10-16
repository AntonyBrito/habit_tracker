import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, Button, TouchableOpacity, Alert, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import * as ImagePicker from 'expo-image-picker';

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

  const takePhoto = async (habitId) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão Negada', 'Você precisa permitir o acesso à câmera para tirar fotos.');
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });

    if (!result.canceled) {
      markHabitCompleted(habitId, result.assets[0].uri);
    }
  };

  const markHabitCompleted = async (habitId, photoUri = null) => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const updatedHabits = habits.map(habit => {
        if (habit.id === habitId) {
          const newCompleted = { ...habit.completed };
          newCompleted[today] = { done: true, photoUri: photoUri };
          return { ...habit, completed: newCompleted };
        }
        return habit;
      });
      setHabits(updatedHabits);
      await AsyncStorage.setItem('habits', JSON.stringify(updatedHabits));
    } catch (error) {
      console.error(error);
    }
  };

  const unmarkHabitCompleted = async (habitId) => {
     try {
      const today = new Date().toISOString().slice(0, 10);
      const updatedHabits = habits.map(habit => {
        if (habit.id === habitId) {
          const newCompleted = { ...habit.completed };
          delete newCompleted[today];
          return { ...habit, completed: newCompleted };
        }
        return habit;
      });
      setHabits(updatedHabits);
      await AsyncStorage.setItem('habits', JSON.stringify(updatedHabits));
    } catch (error) {
      console.error(error);
    }
  }

  const handleCompletionPress = (habitId, isCompleted) => {
      if (isCompleted) {
          unmarkHabitCompleted(habitId)
      } else {
        Alert.alert(
            "Marcar Hábito",
            "Deseja adicionar uma foto ao seu registro?",
            [
                { text: "Apenas Marcar", onPress: () => markHabitCompleted(habitId) },
                { text: "Tirar Foto", onPress: () => takePhoto(habitId) },
                { text: "Cancelar", style: "cancel" }
            ]
        );
      }
  };

  const deleteHabit = async (habitId) => {
    try {
      const habitToDelete = habits.find(h => h.id === habitId);
      if (habitToDelete && habitToDelete.notificationId) {
        await Notifications.cancelScheduledNotificationAsync(habitToDelete.notificationId);
      }
      const updatedHabits = habits.filter(h => h.id !== habitId);
      setHabits(updatedHabits);
      await AsyncStorage.setItem('habits', JSON.stringify(updatedHabits));
    } catch (error) {
      console.error(error);
    }
  };

  const confirmDeleteHabit = (habitId) => {
    Alert.alert('Remover Hábito', 'Tem certeza?',
      [{ text: 'Cancelar' }, { text: 'Remover', onPress: () => deleteHabit(habitId) }],
    );
  };

  const renderItem = ({ item }) => {
    const today = new Date().toISOString().slice(0, 10);
    const completionData = item.completed && item.completed[today];
    const isCompletedToday = completionData && completionData.done;

    return (
      <View style={styles.habitItem}>
        <View style={styles.habitInfo}>
          <Text style={styles.habitName}>{item.name}</Text>
          <TouchableOpacity
            style={[styles.completeButton, isCompletedToday ? styles.completedButton : styles.incompleteButton]}
            onPress={() => handleCompletionPress(item.id, isCompletedToday)}
          >
            <Text style={styles.buttonText}>{isCompletedToday ? 'Feito!' : 'Marcar'}</Text>
          </TouchableOpacity>
        </View>
        {isCompletedToday && completionData.photoUri && (
          <Image source={{ uri: completionData.photoUri }} style={styles.photo} />
        )}
        <View style={styles.actionsContainer}>
          <TouchableOpacity onPress={() => navigation.navigate('EditHabit', { habitId: item.id })} style={[styles.actionButton, styles.editButton]}>
            <Text style={styles.actionButtonText}>Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => confirmDeleteHabit(item.id)} style={[styles.actionButton, styles.deleteButton]}>
            <Text style={styles.actionButtonText}>Remover</Text>
          </TouchableOpacity>
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
        ListEmptyComponent={<Text style={styles.emptyText}>Nenhum hábito cadastrado.</Text>}
        contentContainerStyle={{ paddingBottom: 80 }}
      />
      <View style={styles.addButtonContainer}>
        <Button title="Adicionar Novo Hábito" onPress={() => navigation.navigate('AddHabit')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  habitItem: { backgroundColor: '#f9f9f9', padding: 15, marginVertical: 8, borderRadius: 5 },
  habitInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  habitName: { fontSize: 18, flex: 1 },
  completeButton: { paddingVertical: 10, paddingHorizontal: 15, borderRadius: 5 },
  completedButton: { backgroundColor: 'green' },
  incompleteButton: { backgroundColor: 'orange' },
  buttonText: { color: 'white', fontWeight: 'bold' },
  photo: { width: '100%', height: 200, borderRadius: 5, marginTop: 10 },
  actionsContainer: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  actionButton: { paddingVertical: 5, paddingHorizontal: 10, borderRadius: 5, marginLeft: 10 },
  actionButtonText: { color: 'white' },
  editButton: { backgroundColor: '#1E90FF' },
  deleteButton: { backgroundColor: '#DC143C' },
  emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16 },
  addButtonContainer: { position: 'absolute', bottom: 10, left: 10, right: 10 },
});