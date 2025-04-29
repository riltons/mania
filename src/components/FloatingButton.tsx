import { useState } from "react"
import { Animated, TouchableWithoutFeedback } from "react-native"
import styled from "styled-components/native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { useTheme } from "@/contexts/ThemeProvider"

interface Action {
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    label: string;
    onPress: () => void;
}

interface FloatingButtonProps {
    actions: Action[];
}

export function FloatingButton({ actions }: FloatingButtonProps) {
    const { colors } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const animation = new Animated.Value(0);

    const toggleMenu = () => {
        const toValue = isOpen ? 0 : 1;
        
        Animated.spring(animation, {
            toValue,
            friction: 5,
            useNativeDriver: true,
        }).start();

        setIsOpen(!isOpen);
    };

    const rotation = {
        transform: [
            {
                rotate: animation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0deg", "45deg"],
                }),
            },
        ],
    };

    return (
        <Container>
            {actions.map((action, index) => {
                const translateY = animation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -56 * (index + 1)],
                });

                const scale = animation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 1],
                });

                const opacity = animation.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0, 0, 1],
                });

                return (
                    <TouchableWithoutFeedback
                        key={action.label}
                        onPress={() => {
                            action.onPress();
                            toggleMenu();
                        }}
                    >
                        <ActionButton
                            style={{
                                transform: [{ translateY }, { scale }],
                            }}
                        >
                            <MaterialCommunityIcons
                                name={action.icon}
                                size={24}
                                color={colors.accent}
                            />
                            <ActionLabel style={{ opacity }}>
                                <ActionLabelText>{action.label}</ActionLabelText>
                            </ActionLabel>
                        </ActionButton>
                    </TouchableWithoutFeedback>
                );
            })}

            <MainButton onPress={toggleMenu}>
                <Animated.View style={rotation}>
                    <MaterialCommunityIcons
                        name="plus"
                        size={24}
                        color={colors.secondary}
                    />
                </Animated.View>
            </MainButton>
        </Container>
    );
}

const Container = styled.View`
    position: absolute;
    bottom: 16px;
    right: 16px;
    align-items: flex-end;
`;

const MainButton = styled.TouchableOpacity`
    width: 56px;
    height: 56px;
    border-radius: 28px;
    background-color: ${({ theme }) => theme.colors.primary};
    align-items: center;
    justify-content: center;
    elevation: 5;
`;

const ActionButton = styled(Animated.View)`
    position: absolute;
    width: 48px;
    height: 48px;
    border-radius: 24px;
    background-color: ${({ theme }) => theme.colors.secondary};
    align-items: center;
    justify-content: center;
    elevation: 5;
`;

const ActionLabel = styled(Animated.View)`
    position: absolute;
    right: 60px;
    background-color: ${({ theme }) => theme.colors.secondary};
    padding: 8px 16px;
    border-radius: 4px;
    elevation: 5;
`;

const ActionLabelText = styled.Text`
    color: ${({ theme }) => theme.colors.accent};
    font-size: 14px;
    font-weight: 500;
`;
