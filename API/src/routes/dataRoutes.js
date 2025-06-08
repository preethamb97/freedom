import { Router } from 'express';
import * as dataController from '../controllers/dataController.js';
import { authenticateToken } from '../helpers/auth.js';

const router = Router();

// All data routes require authentication
router.use(authenticateToken);

// Store encrypted data
router.post('/:encryptionId', dataController.storeData);

// Get decrypted data (using POST for security)
router.post('/:encryptionId/decrypt', dataController.getData);

// Update encrypted data
router.put('/:dataId', dataController.updateData);

// Delete encrypted data
router.delete('/:dataId', dataController.deleteData);

export default router; 