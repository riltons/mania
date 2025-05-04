import React from 'react';
import { Platform } from 'react-native';
import { LineChart as RNLineChart } from 'react-native-chart-kit';

export const LineChart = (props: any) => {
    if (Platform.OS === 'web') {
        // Remove os eventos do Responder para web
        const {
            onStartShouldSetResponder,
            onResponderTerminationRequest,
            onResponderGrant,
            onResponderMove,
            onResponderRelease,
            onResponderTerminate,
            ...webProps
        } = props;
        
        return <RNLineChart {...webProps} />;
    }
    
    return <RNLineChart {...props} />;
};
