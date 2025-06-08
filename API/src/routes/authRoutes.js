import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { authenticateToken } from '../helpers/auth.js';

const router = Router();

// Public routes
router.post('/google', authController.googleLogin);

// Protected routes
router.get('/profile', authenticateToken, authController.getProfile);
router.put('/profile', authenticateToken, authController.updateProfile);

export default router; 