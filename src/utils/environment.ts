import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Retorna true se não estiver em ambiente de desenvolvimento (__DEV__ === false)
 */
export const isProduction = (): boolean => {
  return !__DEV__;
};

/**
 * Retorna informações sobre o ambiente de execução atual
 */
export const getEnvironmentInfo = () => {
  return {
    platform: Platform.OS,
    version: Platform.Version,
    isProduction: isProduction(),
    appOwnership: Constants.appOwnership,
    expoVersion: Constants.expoVersion,
    nativeAppVersion: Constants.nativeAppVersion,
    nativeBuildVersion: Constants.nativeBuildVersion,
  };
};

/**
 * Registra informações sobre o ambiente no console
 */
export const logEnvironmentInfo = () => {
  const info = getEnvironmentInfo();
  console.log('Ambiente de execução:', info);
  return info;
};