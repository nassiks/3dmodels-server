const ApplicationModel = require("../models/application-model");
const UserModel = require("../models/user-model");
const ApiError = require("../exceptions/api-error");
class ApplicationController {
  async createApplication(req, res, next) {
    try {
      const userId = req.user.id;
      const existingApplication = await ApplicationModel.findOne({
        userId,
        status: "pending",
      });

      if (existingApplication) {
        return next(ApiError.BadRequest("У вас уже есть отправленная заявка."));
      }

      const application = new ApplicationModel({ userId });
      await application.save();

      res.json(application);
    } catch (e) {
      next(e);
    }
  }

  async getApplications(req, res, next) {
    try {
      const applications = await ApplicationModel.find().populate(
        "userId",
        "username email role"
      );
      res.json(applications);
    } catch (e) {
      next(e);
    }
  }

  async updateApplicationStatus(req, res, next) {
    try {
      const { applicationId, status } = req.body;
      const application = await ApplicationModel.findById(applicationId);

      if (!application) {
        return next(ApiError.BadRequest("Заявка не найдена."));
      }

      application.status = status;
      await application.save();

      if (status === "approved") {
        const user = await UserModel.findById(application.userId);
        user.role = "researcher";
        await user.save();
      }

      res.json(application);
    } catch (e) {
      next(e);
    }
  }
}

module.exports = new ApplicationController();
