const Router = require('express').Router;
const postController = require('../controllers/post-controller');
const handleValidationErrors = require('../middlewares/validation-middleware');
const authMiddleware = require('../middlewares/auth-middleware');
const adminMiddleware = require("../middlewares/admin-middleware");

const router = new Router();

router.get('/tags', postController.getLastTags);
router.get('/', postController.getAll);
router.get('/:id', postController.getOne);
router.post('/', authMiddleware, adminMiddleware, handleValidationErrors, postController.create);
router.delete('/:id', authMiddleware, postController.remove);
router.patch('/:id', authMiddleware, handleValidationErrors, postController.update);
router.post('/:id/like', authMiddleware, postController.likePost);
router.get('/:id/comments', postController.getComments);
router.post('/:id/comments', authMiddleware, postController.addComment);
router.delete('/comments/:id', authMiddleware, postController.deleteComment);
router.get('/tags/:tag', postController.getPostsByTag);

module.exports = router;
