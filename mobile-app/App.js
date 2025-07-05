import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons'; // Expo já vem com essa biblioteca

// ###################################################################################
// ##  CONFIGURAÇÃO MAIS IMPORTANTE DO PROJETO                                      ##
// ##  Substitua pelo IP do computador onde o backend está rodando.                 ##
// ##  Use o comando 'ipconfig' (Windows) ou 'ifconfig' (Linux/macOS) para achar.   ##
// ###################################################################################
const BACKEND_IP = '192.168.1.10'; // <-- MUDE AQUI
const API_URL = `http://${BACKEND_IP}:3000`;

// Cria uma instância do Axios para reutilização
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 5000,
});

const screenWidth = Dimensions.get('window').width;

// ===================================================================================
// TELA DE CONFIGURAÇÃO
// ===================================================================================
function ConfigurationScreen() {
  const [threshold, setThreshold] = useState('');
  const [currentThreshold, setCurrentThreshold] = useState('...');
  const [isLoading, setIsLoading] = useState(false);

  const fetchCurrentThreshold = async () => {
    try {
      const response = await apiClient.get('/config');
      setCurrentThreshold(String(response.data.threshold_cm));
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível buscar a configuração atual do backend.');
      console.error('Fetch error:', error);
    }
  };

  // Busca a configuração atual ao carregar a tela
  useFocusEffect(
    useCallback(() => {
      fetchCurrentThreshold();
    }, [])
  );

  const handleSaveThreshold = async () => {
    if (!threshold || isNaN(Number(threshold))) {
      Alert.alert('Valor Inválido', 'Por favor, insira um número válido para o limiar.');
      return;
    }
    setIsLoading(true);
    try {
      const response = await apiClient.post('/config', {
        threshold_cm: Number(threshold),
      });
      Alert.alert('Sucesso!', 'A nova configuração foi salva.');
      setCurrentThreshold(String(response.data.threshold_cm));
      setThreshold(''); // Limpa o campo
    } catch (error) {
      Alert.alert('Erro ao Salvar', 'Não foi possível conectar ao backend. Verifique o IP e se o servidor está rodando.');
      console.error('Save error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Configuração do Sensor</Text>
        <Text style={styles.subtitle}>Defina o limiar de distância para o alarme disparar.</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Limiar Atual</Text>
          <Text style={styles.currentValue}>{currentThreshold} cm</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Definir Novo Limiar (em cm)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: 25"
            placeholderTextColor="#666"
            keyboardType="numeric"
            value={threshold}
            onChangeText={setThreshold}
          />
          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleSaveThreshold}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Salvar Configuração</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ===================================================================================
// TELA DE HISTÓRICO
// ===================================================================================
function HistoryScreen() {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/logs');
      // O backend retorna os mais novos primeiro, revertemos para o gráfico
      const sortedLogs = response.data.logs.reverse();
      setLogs(sortedLogs);
    } catch (e) {
      setError('Falha ao buscar dados. Verifique a conexão com o backend.');
      console.error('Fetch logs error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Busca os logs sempre que a tela entra em foco
  useFocusEffect(
    useCallback(() => {
      fetchLogs();
    }, [])
  );

  const chartData = {
    labels: logs.map(log => new Date(log.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })).slice(-10), // Pega os últimos 10
    datasets: [
      {
        data: logs.map(log => log.distancia_cm).slice(-10), // Pega os últimos 10
        color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`,
        strokeWidth: 2,
      },
    ],
    legend: ["Distância (cm)"],
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Histórico de Leituras</Text>
        <Text style={styles.subtitle}>Últimas medições recebidas do sensor.</Text>

        {isLoading ? (
          <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 50 }} />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : logs.length > 0 ? (
          <LineChart
            data={chartData}
            width={screenWidth - 32}
            height={250}
            yAxisSuffix=" cm"
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        ) : (
          <Text style={styles.errorText}>Nenhum dado de histórico encontrado.</Text>
        )}
        <TouchableOpacity style={styles.button} onPress={fetchLogs}>
          <Text style={styles.buttonText}>Atualizar Dados</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ===================================================================================
// NAVEGAÇÃO PRINCIPAL (ABAS)
// ===================================================================================
const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <>
      <StatusBar barStyle="light-content" />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName;
              if (route.name === 'Configuração') {
                iconName = focused ? 'settings' : 'settings-outline';
              } else if (route.name === 'Histórico') {
                iconName = focused ? 'analytics' : 'analytics-outline';
              }
              return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#007AFF',
            tabBarInactiveTintColor: 'gray',
            tabBarStyle: { backgroundColor: '#1C1C1E' },
            headerStyle: { backgroundColor: '#1C1C1E' },
            headerTitleStyle: { color: '#FFF' },
          })}
        >
          <Tab.Screen name="Configuração" component={ConfigurationScreen} />
          <Tab.Screen name="Histórico" component={HistoryScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </>
  );
}

// ===================================================================================
// ESTILOS E CONFIGURAÇÕES VISUAIS
// ===================================================================================
const chartConfig = {
  backgroundGradientFrom: "#1e2923",
  backgroundGradientTo: "#08130D",
  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  strokeWidth: 2,
  barPercentage: 0.5,
  useShadowColorFromDataset: false,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContent: {
    padding: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 24,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 16,
  },
  currentValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#007AFF',
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#2C2C2E',
    color: '#FFF',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 18,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#555',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#FF3B30',
    textAlign: 'center',
    marginTop: 20,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
});