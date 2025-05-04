import React, { useState, useRef } from 'react';
import { Dimensions, Animated, Image } from 'react-native';
import styled from 'styled-components/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/core/contexts/ThemeProvider';
import { useRouter } from 'expo-router';
import { InternalHeader } from '@/components/layout/InternalHeader';

const { width } = Dimensions.get('window');

const Container = styled.View`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.backgroundDark};
`;

const Slide = styled.View`
  width: ${width}px;
  align-items: center;
  justify-content: center;
  padding: 40px;
`;

const SlideIcon = styled.View`
  margin-bottom: 24px;
  width: 250px;
  height: 200px;
  border-radius: 12px;
  overflow: hidden;
`;

const SlideImage = styled.Image`
  width: 100%;
  height: 100%;
`;

const SlideTitle = styled.Text`
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 24px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 12px;
`;

const SlideDescription = styled.Text`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 16px;
  text-align: center;
  margin-bottom: 24px;
`;

const DotsContainer = styled.View`
  position: absolute;
  bottom: 80px;
  width: 100%;
  flex-direction: row;
  justify-content: center;
`;

const Dot = styled.View`
  width: 8px;
  height: 8px;
  border-radius: 4px;
  margin: 0 4px;
  background-color: ${({ theme }) => theme.colors.gray300};
`;

const ButtonsContainer = styled.View`
  position: absolute;
  bottom: 40px;
  width: 100%;
  flex-direction: row;
  justify-content: space-between;
  padding: 0 20px;
`;

const Button = styled.TouchableOpacity`
  padding: 10px 20px;
`;

const ButtonText = styled.Text`
  color: ${({ theme }) => theme.colors.primary};
  font-size: 16px;
  font-weight: bold;
`;

export default function Onboarding() {
  const { colors } = useTheme();
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<any>(null);

  const slides = [
    {
      key: '1',
      title: 'Bem-vindo ao Dominomania',
      description: 'Registre seus jogos e competições com estilo!',
      image: require('../../../assets/images/domino1.jpg'),
    },
    {
      key: '2',
      title: 'Comunidades',
      description: 'Crie Comunidades para grupos de pessoas que jogam juntas, com score independente.',
      image: require('../../../assets/images/domino2.jpg.png'),
    },
    {
      key: '3',
      title: 'Competições',
      description: 'Cada vez que a galera se junta para jogar dominó, você cria uma competição, para que ao final o sistema apure o desempenho de cada jogador e dupla e declare os vencedores .',
      image: require('../../../assets/images/domino3.jpg.png'),
    },
    {
      key: '4',
      title: 'Jogos',
      description: 'Crie jogos e registre resultados das partidas em tempo real.',
      image: require('../../../assets/images/domino4.jpg.png'),
    },
    {
      key: '5',
      title: 'Estatísticas',
      description: 'Acompanhe seu desempenho com estatísticas detalhadas.',
      image: require('../../../assets/images/domino5.png'),
    },
  ];

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  );

  const onMomentumScrollEnd = (event: any) => {
    const newIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(newIndex);
  };

  const nextSlide = () => {
    if (currentIndex < slides.length - 1) {
      scrollRef.current?.scrollTo({ x: width * (currentIndex + 1), animated: true });
    } else {
      router.replace('/dashboard');
    }
  };

  const skip = () => router.replace('/dashboard');

  return (
    <Container>
      <InternalHeader title="Introdução ao Dominomania" onBack={() => router.replace('/dashboard')} />
      <Animated.ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={onMomentumScrollEnd}
        ref={scrollRef}
      >
        {slides.map(slide => (
          <Slide key={slide.key}>
            <SlideIcon>
              <SlideImage source={slide.image} />
            </SlideIcon>
            <SlideTitle>{slide.title}</SlideTitle>
            <SlideDescription>{slide.description}</SlideDescription>
          </Slide>
        ))}
      </Animated.ScrollView>
      <DotsContainer>
        {slides.map((_, idx) => (
          <Dot
            key={idx}
            style={{
              backgroundColor: idx === currentIndex ? colors.primary : colors.gray300,
            }}
          />
        ))}
      </DotsContainer>
      <ButtonsContainer>
        <Button onPress={skip}>
          <ButtonText>Pular</ButtonText>
        </Button>
        <Button onPress={nextSlide}>
          <ButtonText>{currentIndex === slides.length - 1 ? 'Começar' : 'Próximo'}</ButtonText>
        </Button>
      </ButtonsContainer>
    </Container>
  );
}

