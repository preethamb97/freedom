import { Router } from 'express';
import * as encryptionController from '../controllers/encryptionController.js';
import { authenticateToken } from '../helpers/auth.js';

const router = Router();

// All encryption routes require authentication
router.use(authenticateToken);

router.post('/', encryptionController.createEncryption);
router.get('/', encryptionController.getUserEncryptions);
router.post('/:encryptionId/verify-key', encryptionController.verifyEncryptionKey);

export default router; 