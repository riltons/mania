import React from 'react';
import { Modal, View, TouchableOpacity, StyleSheet, Text, Platform } from 'react-native';
import styled from 'styled-components/native';
import { useTheme } from 'styled-components/native';

interface AlertModalProps {
    visible: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel?: () => void;
    onClose?: () => void;
}

const ModalContainer = styled.View`
    flex: 1;
    justify-content: center;
    align-items: center;
    background-color: rgba(0, 0, 0, 0.5);
    padding: 20px;
`;

const ModalContent = styled.View`
    background-color: ${props => props.theme.colors.backgroundLight};
    border-radius: 12px;
    padding: 20px;
    width: 100%;
    max-width: 400px;
    align-items: center;
`;

const ModalTitle = styled.Text`
    font-size: 18px;
    font-weight: bold;
    color: ${props => props.theme.colors.textPrimary};
    margin-bottom: 12px;
    text-align: center;
`;

const ModalMessage = styled.Text`
    font-size: 16px;
    color: ${props => props.theme.colors.textPrimary};
    margin-bottom: 20px;
    text-align: center;
`;

const ButtonsContainer = styled.View`
    flex-direction: row;
    justify-content: center;
    width: 100%;
    gap: 12px;
`;

const ConfirmButton = styled.TouchableOpacity`
    background-color: ${props => props.theme.colors.accent};
    padding: 12px 20px;
    border-radius: 8px;
    align-items: center;
    justify-content: center;
    flex: 1;
`;

const CancelButton = styled.TouchableOpacity`
    background-color: ${props => props.theme.colors.gray500};
    padding: 12px 20px;
    border-radius: 8px;
    align-items: center;
    justify-content: center;
    flex: 1;
`;

const ButtonText = styled.Text`
    color: ${props => props.theme.colors.white};
    font-size: 16px;
    font-weight: 600;
`;

const AlertModal: React.FC<AlertModalProps> = ({
    visible,
    title,
    message,
    confirmText = 'Sim',
    cancelText = 'Não',
    onConfirm,
    onCancel,
    onClose
}) => {
    const theme = useTheme();
    
    const handleCancel = () => {
        if (onCancel) {
            onCancel();
        }
        if (onClose) {
            onClose();
        }
    };

    const handleConfirm = () => {
        onConfirm();
        if (onClose) {
            onClose();
        }
    };

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={handleCancel}
        >
            <ModalContainer>
                <ModalContent theme={theme}>
                    <ModalTitle theme={theme}>{title}</ModalTitle>
                    <ModalMessage theme={theme}>{message}</ModalMessage>
                    <ButtonsContainer>
                        {onCancel && (
                            <CancelButton theme={theme} onPress={handleCancel}>
                                <ButtonText theme={theme}>{cancelText}</ButtonText>
                            </CancelButton>
                        )}
                        <ConfirmButton theme={theme} onPress={handleConfirm}>
                            <ButtonText theme={theme}>{confirmText}</ButtonText>
                        </ConfirmButton>
                    </ButtonsContainer>
                </ModalContent>
            </ModalContainer>
        </Modal>
    );
};

export default AlertModal;