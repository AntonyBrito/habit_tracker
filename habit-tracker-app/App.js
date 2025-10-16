import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import * as Notifications from 'expo-notifications';

import HabitListScreen from './screens/HabitListScreen';
import AddHabitScreen from './screens/AddHabitScreen';
import ProgressScreen from './screens/ProgressScreen';
import EditHabitScreen from './screens/EditHabitScreen';

const Drawer = createDrawerNavigator();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function App() {
  useEffect(() => {
    const requestPermissions = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        alert('Você precisa habilitar as notificações para usar o recurso de lembretes!');
      }
    };
    requestPermissions();
  }, []);

  return (
    <NavigationContainer>
      <Drawer.Navigator initialRouteName="HabitList">
        <Drawer.Screen name="HabitList" component={HabitListScreen} options={{ title: 'Meus Hábitos' }} />
        <Drawer.Screen name="AddHabit" component={AddHabitScreen} options={{ title: 'Adicionar Hábito' }} />
        <Drawer.Screen name="Progress" component={ProgressScreen} options={{ title: 'Meu Progresso' }} />
        <Drawer.Screen
          name="EditHabit"
          component={EditHabitScreen}
          options={{
            title: 'Editar Hábito',
            drawerLabel: () => null, // Hide from drawer menu
          }}
        />
      </Drawer.Navigator>
    </NavigationContainer>
  );
}