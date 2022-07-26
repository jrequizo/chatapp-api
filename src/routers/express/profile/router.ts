import express from 'express'
import multer from 'multer'

import { handler as pfpUploadHandler } from './pfp-upload/pfp-upload'

const upload = multer();
const router = express.Router();

router.post('/:uid/upload', upload.single('pfp'), pfpUploadHandler);

export default router;