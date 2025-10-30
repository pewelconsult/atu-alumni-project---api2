//atu-network-api\src\config\db.js
import pkg from "pg";
import dotenv from "dotenv";

const { Pool } = pkg;

dotenv.config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
});

pool.on("connect", () => {
    console.log("✅ Connection pool established with database");
});

pool.on("error", (err) => {
    console.error("❌ Unexpected database error:", err);
    process.exit(-1);
});

// Test connection on startup
pool.query("SELECT NOW()", (err, res) => {
    if (err) {
        console.error("❌ Database connection failed:", err);
    } else {
        console.log("✅ Database connected successfully at:", res.rows[0].now);
    }
});

export default pool;