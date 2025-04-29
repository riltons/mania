import { View, Text, ScrollView, StyleSheet, Image, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

export default function LandingPage() {
  return (
    <ScrollView style={styles.container}>
      <StatusBar style="light" backgroundColor="#8257E5" />
      <LinearGradient
        colors={['#8257E5', '#8257E5']}
        style={styles.header}
      >
        <Image
          source={require('../../assets/images/dominomania-logo.png')}
          style={styles.logo}
        />
        <Text style={styles.title}>Dominomania</Text>
        <Text style={styles.subtitle}>Transforme suas partidas de dominó em competições profissionais</Text>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏆 Organize como um Profissional</Text>
          <Text style={styles.sectionText}>
            Chega de anotar pontos em papel! Gerencie suas competições com facilidade,
            acompanhe pontuações em tempo real e mantenha todo histórico organizado.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👥 Conecte sua Galera</Text>
          <Text style={styles.sectionText}>
            Crie sua comunidade e integre automaticamente com WhatsApp. Mantenha todos
            os jogadores informados e engajados em um só lugar.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Descubra os Campeões</Text>
          <Text style={styles.sectionText}>
            Acompanhe estatísticas detalhadas, rankings e histórico completo.
            Saiba quem são os verdadeiros mestres do dominó na sua região!
          </Text>
        </View>

        <View style={styles.featuresSection}>
          <Text style={styles.featureTitle}>Recursos Exclusivos:</Text>
          <View style={styles.featureItem}>
            <Ionicons name="trophy-outline" size={24} color="#8257E5" />
            <Text style={styles.featureText}>Pontuação especial para Carroça, Lá-e-lô e Cruzada</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="people-outline" size={24} color="#8257E5" />
            <Text style={styles.featureText}>Sorteio automático de duplas</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="stats-chart-outline" size={24} color="#8257E5" />
            <Text style={styles.featureText}>Ranking detalhado de jogadores e duplas</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="logo-whatsapp" size={24} color="#8257E5" />
            <Text style={styles.featureText}>Integração com grupos do WhatsApp</Text>
          </View>
        </View>

        <View style={styles.ctaSection}>
          <Text style={styles.ctaTitle}>Comece a Jogar Agora!</Text>
          <Text style={styles.ctaText}>
            Junte-se a milhares de jogadores que já estão revolucionando
            suas competições de dominó. É grátis!
          </Text>
          
          <Link href="/pricing" asChild>
            <Pressable style={styles.pricingButton}>
              <Text style={styles.pricingButtonText}>Ver Planos</Text>
            </Pressable>
          </Link>

          <Link href="/login" asChild>
            <Pressable style={styles.loginButton}>
              <Text style={styles.loginButtonText}>Já tenho uma conta</Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5FA',
  },
  header: {
    padding: 40,
    alignItems: 'center',
    paddingTop: 50,
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 10,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 20,
    color: 'white',
    textAlign: 'center',
    opacity: 0.9,
    paddingHorizontal: 20,
  },
  content: {
    padding: 20,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#8257E5',
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 17,
    color: '#505059',
    lineHeight: 26,
  },
  featuresSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
  },
  featureTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8257E5',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  featureText: {
    fontSize: 16,
    color: '#505059',
    flex: 1,
  },
  ctaSection: {
    alignItems: 'center',
    padding: 28,
    backgroundColor: '#8257E5',
    borderRadius: 16,
    marginVertical: 20,
  },
  ctaTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
    textAlign: 'center',
  },
  ctaText: {
    fontSize: 18,
    color: 'white',
    opacity: 0.9,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  ctaButton: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 36,
    paddingVertical: 18,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  ctaButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  pricingButton: {
    backgroundColor: '#22c55e',
    paddingVertical: 18,
    paddingHorizontal: 36,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  pricingButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  loginButton: {
    paddingVertical: 12,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});
