import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, Button, TouchableOpacity,
  Alert, Image, UIManager, Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { Layout, FadeIn, FadeOut } from 'react-native-reanimated';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function HabitListScreen({ navigation }) {
  const [habits, setHabits] = useState([]);

  const fetchHabits = async () => {
    try {
      const storedHabits = await AsyncStorage.getItem('habits');
      setHabits(storedHabits ? JSON.parse(storedHabits) : []);
    } catch (error) { console.error(error); }
  };

  useFocusEffect(useCallback(() => { fetchHabits(); }, []));

  const promptForNote = (callback) => {
    Alert.prompt("Adicionar Nota", "Deseja adicionar uma nota? (Opcional)",
      [{ text: "Pular", onPress: () => callback(null), style: "cancel" }, { text: "Salvar", onPress: (note) => callback(note) }],
      "plain-text"
    );
  };

  const takePhoto = async (habitId) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão Negada', 'Acesso à câmera é necessário.');
      return;
    }
    let result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [4, 3], quality: 0.5 });
    if (!result.canceled) {
      promptForNote((note) => markHabitCompleted(habitId, result.assets[0].uri, note));
    }
  };

  const markHabitCompleted = async (habitId, photoUri = null, note = null) => {
    const today = new Date().toISOString().slice(0, 10);
    const updatedHabits = habits.map(habit =>
      habit.id === habitId
        ? { ...habit, completed: { ...habit.completed, [today]: { done: true, photoUri, note } } }
        : habit
    );
    setHabits(updatedHabits);
    await AsyncStorage.setItem('habits', JSON.stringify(updatedHabits));
  };

  const unmarkHabitCompleted = async (habitId) => {
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
  };

  const deleteHabit = async (habitId) => {
    try {
      const habitToDelete = habits.find(h => h.id === habitId);
      if (habitToDelete?.notificationId) {
        await Notifications.cancelScheduledNotificationAsync(habitToDelete.notificationId);
      }
      const updatedHabits = habits.filter(h => h.id !== habitId);
      setHabits(updatedHabits);
      await AsyncStorage.setItem('habits', JSON.stringify(updatedHabits));
    } catch (error) {
      console.error("Failed to delete habit", error);
    }
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
      <Animated.View entering={FadeIn.duration(500)} exiting={FadeOut.duration(300)} layout={Layout.springify()}>
        <LinearGradient colors={isCompletedToday ? ['#6EE7B7', '#34D399'] : ['#FFFFFF', '#F0F2F5']} style={styles.habitCard}>
          <View style={styles.habitHeader}>
            <Text style={[styles.habitName, isCompletedToday && styles.completedText]}>{item.name}</Text>
            <View style={styles.actionsContainer}>
              <TouchableOpacity onPress={() => navigation.navigate('EditHabit', { habitId: item.id })} style={styles.iconButton}><Feather name="edit-2" size={20} color={isCompletedToday ? '#fff' : '#666'} /></TouchableOpacity>
              <TouchableOpacity onPress={() => confirmDeleteHabit(item.id)} style={styles.iconButton}><Feather name="trash-2" size={20} color={isCompletedToday ? '#fff' : '#E53935'} /></TouchableOpacity>
            </View>
          </View>

          {isCompletedToday && completionData.photoUri && <Image source={{ uri: completionData.photoUri }} style={styles.photo} />}
          {isCompletedToday && completionData.note && (
            <View style={styles.noteContainer}><Feather name="book-open" size={16} color="#1E3A8A" /><Text style={styles.noteText}>{completionData.note}</Text></View>
          )}

          <View style={styles.habitFooter}>
            {isCompletedToday ? (
              <TouchableOpacity style={styles.statusButton} onPress={() => unmarkHabitCompleted(item.id)}>
                <Feather name="check-circle" size={24} color="white" /><Text style={styles.statusButtonText}>Hábito Concluído!</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.completionActions}>
                <TouchableOpacity style={styles.actionButton} onPress={() => promptForNote((note) => markHabitCompleted(item.id, null, note))}>
                  <Feather name="check" size={20} color="#34D399" /><Text style={styles.actionButtonText}>Marcar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={() => takePhoto(item.id)}>
                  <Feather name="camera" size={20} color="#5856D6" /><Text style={styles.actionButtonText}>Com Foto</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };

  return (
    <LinearGradient colors={['#8E2DE2', '#4A00E0']} style={styles.container}>
      <Text style={styles.title}>Meus Hábitos</Text>
      <FlatList
        data={habits}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<View style={styles.emptyContainer}><Text style={styles.emptyText}>Comece uma nova jornada!</Text></View>}
        contentContainerStyle={styles.listContentContainer}
      />
      <View style={styles.addButtonContainer}>
        <Button title="+ Adicionar Novo Hábito" onPress={() => navigation.navigate('AddHabit')} color="#fff" />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginVertical: 20, marginTop: 40 },
  listContentContainer: { paddingHorizontal: 10, paddingBottom: 80 },
  habitCard: { borderRadius: 15, padding: 20, marginVertical: 8, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5 },
  habitHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  habitName: { fontSize: 20, fontWeight: '600', color: '#333', flex: 1 },
  completedText: { color: '#fff', textDecorationLine: 'line-through' },
  actionsContainer: { flexDirection: 'row' },
  iconButton: { marginLeft: 15, padding: 5 },
  photo: { width: '100%', height: 200, borderRadius: 10, marginVertical: 10 },
  noteContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.5)', padding: 10, borderRadius: 8, marginTop: 10 },
  noteText: { marginLeft: 10, fontStyle: 'italic', color: '#1E3A8A' },
  habitFooter: { marginTop: 15, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.1)', paddingTop: 10 },
  completionActions: { flexDirection: 'row', justifyContent: 'space-around' },
  statusButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10 },
  statusButtonText: { color: 'white', fontWeight: 'bold', marginLeft: 10, fontSize: 16 },
  actionButton: { flexDirection: 'row', alignItems: 'center', padding: 10 },
  actionButtonText: { marginLeft: 8, color: '#333', fontWeight: '500' },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { fontSize: 18, color: '#fff', opacity: 0.8 },
  addButtonContainer: { padding: 15, backgroundColor: 'rgba(0,0,0,0.2)', borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
});