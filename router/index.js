const Router = require('express').Router;
const userRouter = require('./user-router');
const postRouter = require('./post-router');
const applicationRouter = require('./application-router');

const router = new Router();

router.use('/users', userRouter);
router.use('/posts', postRouter);
router.use('/applications', applicationRouter);

module.exports = router
