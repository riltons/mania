// app.config.js
// Carrega variáveis de ambiente do arquivo .env
const dotenv = require('dotenv');
// Carrega .env ou arquivo especificado por ENVFILE e força override de variáveis já definidas
dotenv.config({ path: process.env.ENVFILE || '.env', override: true });

const isProduction = process.env.APP_VARIANT === 'production';

module.exports = ({ config }) => ({
  ...config,
  name: isProduction ? 'Dominomania' : 'Dominomania (Staging)',
  updates: {
    ...config.updates,
    url: 'https://u.expo.dev/21d5f3f4-d797-445d-a3d2-839027c57a02',
  },
  extra: {
    ...config.extra,
    // Supabase (produção)
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    supabaseFunctionsUrl: process.env.EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL,
    // Supabase Service Role
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    // Configurações para o EAS
    eas: {
      projectId: '21d5f3f4-d797-445d-a3d2-839027c57a02',
    },
  },
  // Configurações específicas para produção
  android: {
    ...config.android,
    package: 'com.rnnotion',
    versionCode: 1,
  },
  ios: {
    ...config.ios,
    bundleIdentifier: 'com.rnnotion',
    buildNumber: '1.0.0',
  },
});
