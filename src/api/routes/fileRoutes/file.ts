import { Container } from 'typedi';
import { Router } from 'express';
import { FileController } from '@/controllers/fileController';

const router = Router();
const fileController : FileController = Container.get('fileController')

router.post("/upload", fileController.saveFile);
router.get('/file/:fileId', fileController.getFileByRequestParam);
router.get('/file/:cloudId', fileController.getFileByRequestParam)