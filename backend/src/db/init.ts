/**
 * Database initialization script
 * Run this to set up the SQLite database for development
 */
import { getPersistenceService } from '../services/PersistenceService';

async function initializeDatabase() {
  console.log('Initializing database...');
  
  const persistenceService = getPersistenceService();
  
  try {
    await persistenceService.initialize();
    console.log('✓ Database initialized successfully');
    console.log('✓ price_history table created');
    console.log('✓ price_alerts table created');
    console.log('✓ wishlist_items table created');
    console.log('✓ Indexes created');
    
    await persistenceService.close();
    console.log('✓ Database connection closed');
    
    process.exit(0);
  } catch (error) {
    console.error('✗ Failed to initialize database:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  initializeDatabase();
}

export { initializeDatabase };
