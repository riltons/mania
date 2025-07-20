import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/core/contexts/ThemeProvider';
import { LinearGradient } from 'expo-linear-gradient';

export default function OnboardingScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: 'Bem-vindo ao Dominomania!',
      description: 'Transforme suas partidas de dominó em competições profissionais.',
      image: require('../../../assets/domino1.jpg')
    },
    {
      title: 'Organize Competições',
      description: 'Crie e gerencie torneios, acompanhe pontuações e mantenha todo histórico organizado.',
      image: require('../../../assets/domino2.jpg.png')
    },
    {
      title: 'Conecte sua Comunidade',
      description: 'Crie sua comunidade e integre com WhatsApp. Mantenha todos os jogadores informados.',
      image: require('../../../assets/domino3.jpg.png')
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleSkip = () => {
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={[colors.primary, colors.primary]}
        style={styles.background}
      >
        <View style={styles.content}>
          <Image 
            source={steps[currentStep].image} 
            style={styles.image}
            resizeMode="contain"
          />
          
          <Text style={styles.title}>{steps[currentStep].title}</Text>
          <Text style={styles.description}>{steps[currentStep].description}</Text>
          
          <View style={styles.dotsContainer}>
            {steps.map((_, index) => (
              <View 
                key={index} 
                style={[
                  styles.dot, 
                  { backgroundColor: index === currentStep ? '#FFFFFF' : 'rgba(255,255,255,0.4)' }
                ]} 
              />
            ))}
          </View>
          
          <View style={styles.buttonsContainer}>
            <TouchableOpacity 
              style={styles.skipButton} 
              onPress={handleSkip}
            >
              <Text style={styles.skipButtonText}>Pular</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.nextButton} 
              onPress={handleNext}
            >
              <Text style={styles.nextButtonText}>
                {currentStep === steps.length - 1 ? 'Começar' : 'Próximo'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  image: {
    width: 250,
    height: 250,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 40,
    opacity: 0.8,
    paddingHorizontal: 20,
  },
  dotsContainer: {
    flexDirection: 'row',
    marginBottom: 40,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
  },
  skipButton: {
    padding: 15,
  },
  skipButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    opacity: 0.8,
  },
  nextButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
  },
  nextButtonText: {
    color: '#8257E5',
    fontSize: 16,
    fontWeight: 'bold',
  },
});