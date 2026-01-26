const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const assemblyRoutes = require('./routes/assembly.routes');

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Security headers
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// ============================================================================
// ROUTES
// ============================================================================

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Buildline API is running',
    timestamp: new Date().toISOString()
  });
});

// API routes
// API routes
app.use('/api/assembly', assemblyRoutes);
app.use('/api/users', require('./routes/user.routes'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════╗
║                                                    ║
║   🚲  BUILDLINE API Server                         ║
║   Assembly Journey Tracking System                 ║
║                                                    ║
║   Port: ${PORT}                                       ║
║   Environment: ${process.env.NODE_ENV || 'development'}                   ║
║                                                    ║
╚════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
