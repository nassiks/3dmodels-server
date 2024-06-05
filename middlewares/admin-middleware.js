const ApiError = require("../exceptions/api-error");

module.exports = function (req, res, next) {
  try {
    const user = req.user;
    console.log(user.role);
    if (!user) {
      return next(ApiError.UnauthorizedError());
    }
    if (user.role !== "admin") {
      return next(ApiError.Forbidden("Нет доступа"));
    }
    next();
  } catch (e) {
    return next(ApiError.UnauthorizedError());
  }
};
