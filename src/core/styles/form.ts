import styled from 'styled-components/native';
import { colors } from './colors';

export const Container = styled.ScrollView.attrs({
    contentContainerStyle: {
        flexGrow: 1,
        padding: 16,
        backgroundColor: colors.background,
    },
})`
    flex: 1;
    background-color: ${colors.background};
`;

export const FormGroup = styled.View`
    margin-bottom: 16px;
`;

export const Label = styled.Text`
    color: ${colors.text};
    font-size: 16px;
    margin-bottom: 8px;
`;
