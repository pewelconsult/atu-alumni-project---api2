// run-migrations-atu.js
// Customized migration runner for ATU Alumni Network

import { config } from 'dotenv';
import pg from 'pg';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config();

// ============================================
// ATU Alumni Network - Database Configuration
// ============================================

const CLOUD_CONFIG = {
    host: process.env.CLOUD_DB_HOST,
    port: process.env.CLOUD_DB_PORT || 5432,
    database: process.env.CLOUD_DB_NAME || 'alumni_network',
    user: process.env.CLOUD_DB_USER || 'alumni_admin',
    password: process.env.CLOUD_DB_PASSWORD || 'ATU-AlumniNetwork2025New',
    
    // Disable SSL for now (enable for production if needed)
    ssl: false
};

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};

const log = {
    info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
    success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
    error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
    warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
    section: () => console.log(`${colors.bright}${colors.blue}${'='.repeat(60)}${colors.reset}`),
    subsection: (msg) => console.log(`${colors.cyan}${msg}${colors.reset}`),
};

// ============================================
// Main Migration Function
// ============================================

async function runMigrations() {
    let pool;

    try {
        log.section();
        console.log(`${colors.bright}${colors.blue}ATU Alumni Network - Database Migration${colors.reset}`);
        log.section();
        console.log();

        // Display configuration
        log.subsection('Database Configuration:');
        console.log(`   Host: ${CLOUD_CONFIG.host}`);
        console.log(`   Port: ${CLOUD_CONFIG.port}`);
        console.log(`   Database: ${CLOUD_CONFIG.database}`);
        console.log(`   User: ${CLOUD_CONFIG.user}`);
        console.log();

        // Validate configuration
        if (!CLOUD_CONFIG.host || !CLOUD_CONFIG.password) {
            log.error('Cloud database configuration is incomplete!');
            log.warning('Please check your .env file and ensure:');
            console.log('   - CLOUD_DB_HOST is set (public IP address)');
            console.log('   - CLOUD_DB_PASSWORD is set');
            console.log();
            log.info('Get your Cloud SQL public IP:');
            console.log('   gcloud sql instances describe atu-alumni-db --format="value(ipAddresses[0].ipAddress)"');
            console.log();
            process.exit(1);
        }

        // Create connection pool
        log.info('Connecting to Cloud SQL database...');
        pool = new Pool(CLOUD_CONFIG);

        // Test connection
        try {
            const result = await pool.query('SELECT NOW(), current_database(), version()');
            log.success('Connected to database!');
            console.log(`   Time: ${result.rows[0].now}`);
            console.log(`   Database: ${result.rows[0].current_database}`);
            console.log(`   Version: ${result.rows[0].version.split('\n')[0]}`);
            console.log();
        } catch (error) {
            log.error('Failed to connect to database!');
            console.log();
            log.warning('Common issues:');
            console.log('   1. Wrong IP address in .env file');
            console.log('   2. Your IP not authorized in Cloud SQL');
            console.log('   3. Wrong password');
            console.log('   4. Database not running');
            console.log();
            log.info('To authorize your IP:');
            console.log('   1. Go to: https://console.cloud.google.com/sql/instances');
            console.log('   2. Click: atu-alumni-db → Connections → Add Network');
            console.log('   3. Add your IP (get it from: https://whatismyip.com)');
            console.log();
            throw error;
        }

        // Get migrations directory
        const migrationsDir = join(__dirname, 'src', 'migrations');
        
        // Check if directory exists
        try {
            await fs.access(migrationsDir);
        } catch (error) {
            log.error(`Migrations directory not found: ${migrationsDir}`);
            log.warning('Please ensure your migrations are in src/migrations/');
            console.log();
            process.exit(1);
        }

        // Get migration files
        const files = await fs.readdir(migrationsDir);
        const migrationFiles = files
            .filter(f => f.endsWith('.js') && f.match(/^\d+_/))
            .sort();

        if (migrationFiles.length === 0) {
            log.warning('No migration files found in src/migrations/');
            console.log();
            return;
        }

        log.subsection(`Found ${migrationFiles.length} migration file(s):`);
        migrationFiles.forEach((f, i) => {
            console.log(`   ${i + 1}. ${f}`);
        });
        console.log();

        // Create migrations tracking table
        log.info('Setting up migration tracking...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS schema_migrations (
                id SERIAL PRIMARY KEY,
                migration_name VARCHAR(255) UNIQUE NOT NULL,
                executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        log.success('Migration tracking ready');
        console.log();

        // Get executed migrations
        const executedResult = await pool.query(
            'SELECT migration_name FROM schema_migrations ORDER BY executed_at'
        );
        const executedMigrations = new Set(
            executedResult.rows.map(r => r.migration_name)
        );

        if (executedMigrations.size > 0) {
            log.subsection('Previously executed migrations:');
            executedResult.rows.forEach((row, i) => {
                console.log(`   ${i + 1}. ${row.migration_name}`);
            });
            console.log();
        }

        const pendingMigrations = migrationFiles.filter(
            f => !executedMigrations.has(f.replace('.js', ''))
        );

        log.subsection('Migration Status:');
        console.log(`   Already executed: ${executedMigrations.size}`);
        console.log(`   Pending: ${pendingMigrations.length}`);
        console.log();

        if (pendingMigrations.length === 0) {
            log.success('All migrations are up to date!');
            console.log();
            return;
        }

        // Run pending migrations
        let successCount = 0;
        let errorCount = 0;

        log.section();
        log.subsection('Running pending migrations...');
        log.section();
        console.log();

        for (const file of pendingMigrations) {
            const migrationName = file.replace('.js', '');
            
            console.log(`${colors.bright}[${pendingMigrations.indexOf(file) + 1}/${pendingMigrations.length}]${colors.reset} ${file}`);

            try {
                // Import migration
                const migrationPath = join(migrationsDir, file);
                const migration = await import(`file://${migrationPath}`);
                
                // Execute migration
                const runFunction = migration.default || migration;
                if (typeof runFunction === 'function') {
                    // Temporarily redirect console output
                    const originalLog = console.log;
                    console.log = (...args) => originalLog('     ', ...args);
                    
                    await runFunction();
                    
                    console.log = originalLog;
                }

                // Record migration
                await pool.query(
                    'INSERT INTO schema_migrations (migration_name) VALUES ($1)',
                    [migrationName]
                );

                log.success(`Completed: ${file}`);
                console.log();
                successCount++;

            } catch (error) {
                log.error(`Failed: ${file}`);
                console.log(`     Error: ${error.message}`);
                console.log();
                errorCount++;
                
                log.warning('Migration failed. This might be because:');
                console.log('     - The table/column already exists');
                console.log('     - There\'s a constraint violation');
                console.log('     - Dependencies are not met');
                console.log();
            }
        }

        // Summary
        log.section();
        log.subsection('Migration Summary:');
        log.section();
        console.log();
        console.log(`   ${colors.green}✅ Successful: ${successCount}${colors.reset}`);
        console.log(`   ${colors.red}❌ Failed: ${errorCount}${colors.reset}`);
        console.log();

        // Show current database state
        const tablesResult = await pool.query(`
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public'
            ORDER BY tablename;
        `);

        log.subsection(`Current tables in database (${tablesResult.rows.length}):`);
        tablesResult.rows.forEach((row, i) => {
            console.log(`   ${i + 1}. ${row.tablename}`);
        });
        console.log();

        // Show next steps
        if (successCount > 0) {
            log.section();
            log.success('Schema sync complete!');
            log.section();
            console.log();
            log.subsection('Next steps:');
            console.log('   1. Test your API: curl https://atu-alumni-api-363394982551.us-central1.run.app/api/health');
            console.log('   2. Verify tables in Cloud Console');
            console.log('   3. Check application logs');
            console.log('   4. Test authentication');
            console.log();
        }

    } catch (error) {
        log.error(`Fatal error: ${error.message}`);
        console.error(error);
        process.exit(1);
    } finally {
        if (pool) {
            await pool.end();
        }
    }
}

// ============================================
// Run
// ============================================

console.log();
runMigrations();