import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import styled from 'styled-components/native';

// Interface para tipagem das props do tema
interface ThemeProps {
  theme: {
    colors: {
      background: string;
      backgroundMedium: string;
    }
  }
}

// Interface para as props do componente
interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

// Componente Card estilizado
const CardContainer = styled(View)`
  background-color: ${(props: ThemeProps) => props.theme.colors.background};
  border-radius: 8px;
  padding: 0;
  margin-bottom: 16px;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 3px;
  elevation: 2;
  border: 1px solid ${(props: ThemeProps) => props.theme.colors.backgroundMedium};
`;

/**
 * Card - Componente de exibição de conteúdo com borda e sombra
 * 
 * @param children Conteúdo interno do card
 * @param style Estilo adicional para o card (opcional)
 */
export const Card = ({ children, style }: CardProps) => {
  return (
    <CardContainer style={style}>
      {children}
    </CardContainer>
  );
};

// Estilos padrão para o card
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  }
});
