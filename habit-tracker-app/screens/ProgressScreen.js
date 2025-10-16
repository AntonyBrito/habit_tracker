import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, Image, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';

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
      .filter(([, data]) => data.photoUri)
      .map(([date, data]) => ({ date, uri: data.photoUri }));

    return (
      <View style={styles.habitCard}>
        <Text style={styles.habitName}>{item.name}</Text>
        <View style={styles.progressContainer}>
          <Feather name="trending-up" size={20} color="#007AFF" />
          <Text style={styles.progressText}>
            Cumprido {completedDays} dia(s) no total.
          </Text>
        </View>

        {photos.length > 0 && (
          <View style={styles.photoSection}>
            <Text style={styles.photoTitle}>Diário de Fotos</Text>
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
      <Text style={styles.title}>Meu Progresso</Text>
      <FlatList
        data={habits}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<View style={styles.emptyContainer}><Text style={styles.emptyText}>Sem progresso para mostrar ainda.</Text></View>}
        contentContainerStyle={styles.listContentContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    margin: 20,
    marginBottom: 10,
    textAlign: 'center',
    color: '#333',
  },
  listContentContainer: {
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  habitCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  habitName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  progressText: {
    fontSize: 16,
    marginLeft: 8,
    color: '#555',
  },
  photoSection: {
    marginTop: 15,
  },
  photoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  photoContainer: {
    marginRight: 10,
    alignItems: 'center'
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  photoDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 5
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 18,
    color: '#888'
  },
});