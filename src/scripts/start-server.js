console.log('Starting authentication server...');
console.log('Current directory:', __dirname);
console.log('Database path:', require('path').join(__dirname, '../../tournament_app.db'));

// Check if database exists
const fs = require('fs');
const path = require('path');
const dbPath = path.join(__dirname, '../../tournament_app.db');

if (!fs.existsSync(dbPath)) {
    console.error('❌ Database file not found at:', dbPath);
    process.exit(1);
} else {
    console.log('✅ Database file found at:', dbPath);
}

// Check if all required node modules are installed
try {
    require('express');
    require('sqlite3');
    require('bcryptjs');
    require('body-parser');
    require('cookie-parser');
    require('multer');
    console.log('✅ All required modules are installed');
} catch (err) {
    console.error('❌ Missing required module:', err.message);
    console.log('Please run: npm install');
    process.exit(1);
}

// Start the actual server
require('./app.js');
