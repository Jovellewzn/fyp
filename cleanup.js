const fs = require('fs');
const path = require('path');

// Files to delete (excluding database-related files)
const filesToDelete = [
  'api_route_test.js',
  'check_timestamps.js',
  'comprehensive_test.js',
  'create_test_user.js',
  'create_user_id1.js',
  'diagnostic.js',
  'direct_http_test.js',
  'minimal_server.js',
  'minimal_test_server.js',
  'quick_start.sh',
  'quick_test_server.js',
  'route_test.js',
  'server.js',
  'simple_server_test.js',
  'start-server.bat',
  'start_server.bat',
  'test-put.html',
  'test-routes.html',
  'test_api.js',
  'test_auth_flow.js',
  'test_minimal_main.js',
  'test_minimal_server.js',
  'test_no_auth_server.js',
  'test_paths.js',
  'test_server.html',
  'test_server.js',
  'test_simple_start.js',
  'test_tournaments_api.js',
  'TOURNAMENT_FIX_GUIDE.md'
];

console.log('Starting cleanup...');

filesToDelete.forEach(file => {
  try {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
      console.log(`✅ Deleted: ${file}`);
    } else {
      console.log(`⚠️  File not found: ${file}`);
    }
  } catch (error) {
    console.error(`❌ Error deleting ${file}:`, error.message);
  }
});

console.log('Cleanup complete!');
