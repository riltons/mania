import React from 'react';
import { Modal as RNModal, ModalProps } from 'react-native';
import styled from 'styled-components/native';
import { Button } from '../ui/Button';

interface CustomModalProps extends ModalProps {
    title?: string;
    onClose: () => void;
    onConfirm?: () => void;
    confirmText?: string;
    cancelText?: string;
    showCancel?: boolean;
}

export const Modal: React.FC<CustomModalProps> = ({
    title,
    onClose,
    onConfirm,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    showCancel = true,
    children,
    ...props
}) => {
    return (
        <RNModal
            transparent
            animationType="fade"
            onRequestClose={onClose}
            {...props}
        >
            <Overlay>
                <Content>
                    {title && <Title>{title}</Title>}
                    {children}
                    <ButtonContainer>
                        {showCancel && (
                            <Button title={cancelText} onPress={onClose} variant="outline" />
                        )}
                        {onConfirm && (
                            <Button title={confirmText} onPress={onConfirm} variant="primary" />
                        )}
                    </ButtonContainer>
                </Content>
            </Overlay>
        </RNModal>
    );
};

const Overlay = styled.View`
    flex: 1;
    background-color: rgba(0, 0, 0, 0.5);
    justify-content: center;
    align-items: center;
    padding: 20px;
`;

const Content = styled.View`
    background-color: ${({ theme }: { theme: any }) => theme.colors.surface || theme.colors.backgroundMedium};
    border-radius: 12px;
    padding: 24px;
    width: 100%;
    max-width: 400px;
`;

const Title = styled.Text`
    font-size: 18px;
    font-weight: bold;
    color: ${({ theme }: { theme: any }) => theme.colors.text || theme.colors.textPrimary};
    margin-bottom: 16px;
    text-align: center;
`;

const ButtonContainer = styled.View`
    flex-direction: row;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 24px;
`; 