const userService = require('../services/user.service');
const { validationResult } = require('express-validator');

class UserController {
    /**
     * Create new technician
     * POST /api/users/technician
     */
    async createTechnician(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });
            }

            const { email, password, full_name, phone } = req.body;

            const technician = await userService.createTechnician(
                email,
                password,
                full_name,
                phone
            );

            res.status(201).json({
                success: true,
                message: 'Technician created successfully',
                data: technician
            });
        } catch (error) {
            console.error('Create technician error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to create technician'
            });
        }
    }

    /**
     * Get all technicians
     * GET /api/users/technicians
     */
    async getTechnicians(req, res) {
        try {
            const technicians = await userService.getTechnicians();

            res.json({
                success: true,
                data: technicians
            });
        } catch (error) {
            console.error('Get technicians error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to get technicians'
            });
        }
    }
}

module.exports = new UserController();
