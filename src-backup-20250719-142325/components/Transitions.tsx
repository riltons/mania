import { StyleSheet } from 'react-native';
import Animated, { 
    FadeIn, 
    FadeOut,
    Layout,
} from 'react-native-reanimated';

export const PageTransition = ({ children }) => {
    return (
        <Animated.View
            entering={FadeIn.duration(800)}
            exiting={FadeOut.duration(600)}
            layout={Layout.duration(500)}
            style={styles.container}
        >
            {children}
        </Animated.View>
    );
};

export const SlideTransition = ({ children }) => {
    return (
        <Animated.View
            entering={FadeIn.duration(800)}
            exiting={FadeOut.duration(600)}
            layout={Layout.duration(500)}
            style={styles.container}
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
