const Router = require('express').Router;
const applicationController = require('../controllers/application-controller');
const authMiddleware = require('../middlewares/auth-middleware');
const adminMiddleware = require('../middlewares/admin-middleware');

const router = new Router();

router.post('/', authMiddleware, applicationController.createApplication);
router.get('/', authMiddleware, adminMiddleware, applicationController.getApplications);
router.patch('/', authMiddleware, adminMiddleware, applicationController.updateApplicationStatus);

module.exports = router;
