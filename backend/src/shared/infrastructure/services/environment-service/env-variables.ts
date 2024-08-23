export interface EnvVariables {
  // DATABASE_URL: string;
  DB_HOST: string;
  DB_USER: string;
  DB_PASSWORD: string;
  DB_DATABASE: string;
  PORT: number;
  JWT_SECRET: string;
  APPLICATION_NAME: string;
  SMTP_USER: string;
  SMTP_PASSWORD: string;
  SMTP_SERVER: string;
  SMTP_DISPLAY_EMAIL:string;
  SMTP_PORT: number;
  VIEWS_FOLDER: string;
  FRONTEND_URL: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  RADIATION_API: string;
  RADIATION_API_CREDENTIALS: string;
  DATADIS_MONTHS:number;
  TRADE_UPDATE_DAYS:number;
  EMAIL:string;
  EMAIL_PASSWORD:string;
  ENERGY_PREDICTION_API:string;
  STRIPE_PRICE_KEY:string;
  STRIPE_PRODUCT_ID:string;
  STRIPE_SECRET_KEY:string;
}
