import { Pool } from "pg";

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://kompozit:kompozit_dev@localhost:5432/kompozit_erp",
});

export default pool;
