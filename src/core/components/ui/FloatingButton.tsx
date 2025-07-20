import React from 'react';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';
import styled from 'styled-components/native';
import { Feather } from '@expo/vector-icons';
import { ThemeProps } from '@/core/types';

// Interface para tipagem
interface FloatingButtonProps extends TouchableOpacityProps {
  icon: string;
  size?: number;
  color?: string;
  position?: 'bottomRight' | 'bottomLeft' | 'topRight' | 'topLeft';
}

// Componente estilizado com posicionamento flexível
const ButtonContainer = styled(TouchableOpacity)<{
  position: 'bottomRight' | 'bottomLeft' | 'topRight' | 'topLeft';
}>`
  position: absolute;
  width: 56px;
  height: 56px;
  border-radius: 28px;
  background-color: ${(props: ThemeProps) => props.theme.colors.primary};
  justify-content: center;
  align-items: center;
  elevation: 5;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.25;
  shadow-radius: 3.84px;
  
  /* Definição de posicionamento baseado na prop position */
  ${(props) => props.position === 'bottomRight' && `
    right: 16px;
    bottom: 16px;
  `}
  
  ${(props) => props.position === 'bottomLeft' && `
    left: 16px;
    bottom: 16px;
  `}
  
  ${(props) => props.position === 'topRight' && `
    right: 16px;
    top: 16px;
  `}
  
  ${(props) => props.position === 'topLeft' && `
    left: 16px;
    top: 16px;
  `}
`;

/**
 * Botão flutuante para ações principais nas telas
 * 
 * @param icon - Nome do ícone da biblioteca Feather
 * @param size - Tamanho do ícone
 * @param color - Cor do ícone
 * @param position - Posição do botão na tela
 * @param onPress - Função chamada ao pressionar o botão
 */
export const FloatingButton: React.FC<FloatingButtonProps> = ({
  icon,
  size = 24,
  color = '#FFFFFF',
  position = 'bottomRight',
  ...rest
}) => {
  return (
    <ButtonContainer position={position} activeOpacity={0.7} {...rest}>
      {/* @ts-ignore - O tipo do Feather não reconhece todos os nomes de ícones */}
      <Feather name={icon} size={size} color={color} />
    </ButtonContainer>
  );
};
