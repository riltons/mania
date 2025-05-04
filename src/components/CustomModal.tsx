import React from 'react';
import { Modal, View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import styled from 'styled-components/native';

interface CustomModalProps {
    visible: boolean;
    onClose: () => void;
    children: React.ReactNode;
    colors: any;
    title?: string;
    subtitle?: string;
}

const ModalContainer = styled.View`
    flex: 1;
    justify-content: flex-end;
    background-color: rgba(0, 0, 0, 0.5);
`;

const ModalContent = styled.View`
    background-color: ${props => props.colors.backgroundDark};
    border-top-left-radius: 16px;
    border-top-right-radius: 16px;
    padding: 16px;
    max-height: 75%;
`;

const ModalHandle = styled.View`
    width: 40px;
    height: 5px;
    border-radius: 3px;
    background-color: ${props => props.colors.gray500};
    align-self: center;
    margin-bottom: 16px;
`;

const ModalTitle = styled.Text`
    font-size: 18px;
    font-weight: bold;
    color: ${props => props.colors.text};
    margin-bottom: 8px;
`;

const ModalSubtitle = styled.Text`
    font-size: 14px;
    color: ${props => props.colors.textSecondary};
    margin-bottom: 16px;
`;

const CustomModal: React.FC<CustomModalProps> = ({ visible, onClose, children, colors, title, subtitle }) => {
    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <ModalContainer>
                <TouchableOpacity
                    style={styles.backdrop}
                    activeOpacity={1}
                    onPress={onClose}
                />
                <ModalContent colors={colors}>
                    <ModalHandle colors={colors} />
                    {title && <ModalTitle colors={colors}>{title}</ModalTitle>}
                    {subtitle && <ModalSubtitle colors={colors}>{subtitle}</ModalSubtitle>}
                    {children}
                </ModalContent>
            </ModalContainer>
        </Modal>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
});

export default CustomModal;
