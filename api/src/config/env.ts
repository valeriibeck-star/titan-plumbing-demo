export const config = {
  port: parseInt(process.env.PORT || "3001", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl:
    process.env.DATABASE_URL ||
    "postgresql://kompozit:kompozit_dev@localhost:5432/kompozit_erp",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
};
