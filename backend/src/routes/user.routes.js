const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { body } = require('express-validator');

// All routes require authentication
router.use(authenticate);

/**
 * Create new technician
 * Role: supervisor, admin
 */
router.post(
    '/technician',
    authorize('supervisor', 'admin'),
    [
        body('email').isEmail().normalizeEmail(),
        body('password').isLength({ min: 6 }),
        body('full_name').notEmpty().trim(),
        body('phone').optional().trim()
    ],
    userController.createTechnician
);

/**
 * Get all technicians
 * Role: supervisor, admin
 */
router.get(
    '/technicians',
    authorize('supervisor', 'admin'),
    userController.getTechnicians
);

module.exports = router;
