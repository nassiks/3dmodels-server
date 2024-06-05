const Router = require("express").Router;
const userController = require("../controllers/user-controller");
const authMiddleware = require("../middlewares/auth-middleware");
const adminMiddleware = require("../middlewares/admin-middleware");
const { registerValidation, loginValidation, updateValidation } = require("../validations");

const router = new Router();

router.post("/registration", registerValidation, userController.registration);
router.post("/login", loginValidation, userController.login);
router.post("/logout", userController.logout);
router.get("/activate/:link", userController.activate);
router.get("/refresh", userController.refresh);
router.get("/me", authMiddleware, userController.getMe);
router.patch("/me", authMiddleware, updateValidation, userController.updateProfile);
router.get("/researchers", authMiddleware, adminMiddleware, userController.getResearchers);
router.patch("/:userId/role", authMiddleware, adminMiddleware, userController.updateUserRole);

module.exports = router;
