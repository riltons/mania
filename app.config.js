// app.config.js
// Carrega variáveis de ambiente do arquivo .env
const dotenv = require('dotenv');
// Carrega .env ou arquivo especificado por ENVFILE e força override de variáveis já definidas
dotenv.config({ path: process.env.ENVFILE || '.env', override: true });

module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    // Supabase (produção)
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    supabaseFunctionsUrl: process.env.EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL,
    // Stripe
    stripePublishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    // Supabase Service Role
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
});
