import { Router } from 'express';
import { tasksController } from '../controllers/tasks.controller';

const router = Router();

router.get('/', tasksController.list);
router.post('/', tasksController.create);
router.get('/:id', tasksController.getById);
router.put('/:id', tasksController.update);
router.delete('/:id', tasksController.remove);
router.post('/:id/subtasks', tasksController.createSubtask);

export default router;