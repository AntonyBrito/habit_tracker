import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, Image, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

export default function ProgressScreen() {
  const [habits, setHabits] = useState([]);

  const fetchHabits = async () => {
    try {
      const storedHabits = await AsyncStorage.getItem('habits');
      setHabits(storedHabits ? JSON.parse(storedHabits) : []);
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível carregar o progresso.');
    }
  };

  useFocusEffect(useCallback(() => { fetchHabits(); }, []));

  const renderItem = ({ item }) => {
    const completedEntries = item.completed ? Object.entries(item.completed) : [];
    const completedDays = completedEntries.length;
    const photos = completedEntries
      .filter(([date, data]) => data.photoUri)
      .map(([date, data]) => ({ date, uri: data.photoUri }));

    return (
      <View style={styles.habitItem}>
        <Text style={styles.habitName}>{item.name}</Text>
        <Text style={styles.progressText}>
          Cumprido {completedDays} dia(s) no total.
        </Text>
        {photos.length > 0 && (
          <View>
            <Text style={styles.photoTitle}>Diário de Fotos:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {photos.map(photo => (
                <View key={photo.date} style={styles.photoContainer}>
                  <Image source={{ uri: photo.uri }} style={styles.photo} />
                  <Text style={styles.photoDate}>{new Date(photo.date).toLocaleDateString()}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Resumo de Progresso</Text>
      <FlatList
        data={habits}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.emptyText}>Nenhum hábito para mostrar.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  habitItem: { backgroundColor: '#f9f9f9', padding: 20, marginVertical: 8, borderRadius: 5, borderLeftWidth: 5, borderLeftColor: '#1E90FF' },
  habitName: { fontSize: 18, fontWeight: 'bold' },
  progressText: { fontSize: 16, marginTop: 5, color: '#333' },
  emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16 },
  photoTitle: { fontSize: 16, fontWeight: 'bold', marginTop: 15, marginBottom: 5 },
  photoContainer: { marginRight: 10, alignItems: 'center' },
  photo: { width: 100, height: 100, borderRadius: 5 },
  photoDate: { fontSize: 12, color: '#666', marginTop: 2 },
});