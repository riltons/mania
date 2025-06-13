import React, { ReactNode } from 'react';
import { Animated, StyleSheet, ViewStyle } from 'react-native';

// Interface para tipagem das props
interface PageTransitionProps {
  children: ReactNode;
  style?: ViewStyle;
}

/**
 * Componente para adicionar animações de transição entre páginas
 * Utiliza Animated do React Native para criar efeitos suaves
 * 
 * @param children - Conteúdo da página
 * @param style - Estilos adicionais (opcional)
 */
export const PageTransition: React.FC<PageTransitionProps> = ({ children, style }) => {
  // Criamos um valor animado que vai de 0 a 1
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  
  React.useEffect(() => {
    // Quando o componente monta, iniciamos a animação
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    // Quando o componente desmonta, podemos reverter a animação se necessário
    return () => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    };
  }, []);
  
  return (
    <Animated.View 
      style={[
        styles.container,
        style,
        {
          opacity: fadeAnim,
          transform: [
            {
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
