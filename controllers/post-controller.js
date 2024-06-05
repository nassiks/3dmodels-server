const PostModel = require("../models/post-model");
const CommentModel = require("../models/comment-model");
const ApiError = require("../exceptions/api-error");

class PostController {
  async getLastTags(req, res, next) {
    try {
      const posts = await PostModel.aggregate([
        { $sample: { size: 5 } },
      ]).exec();

      let tags = posts.map((obj) => obj.tags).flat();

      const uniqueTagsSet = new Set(
        tags.map((tag) => tag.trim().toLowerCase())
      );
      let uniqueTags = [...uniqueTagsSet];

      uniqueTags = uniqueTags.slice(0, 5);

      res.json(uniqueTags);
    } catch (err) {
      next(ApiError.BadRequest("Не удалось получить тэги"));
    }
  }

  async getPostsByTag(req, res, next) {
    try {
      const tag = req.params.tag;
      const posts = await PostModel.find({ tags: tag }).populate("user").exec();
      res.json(posts);
    } catch (err) {
      next(ApiError.BadRequest("Не удалось получить статьи по тегу"));
    }
  }

  async getAll(req, res, next) {
    try {
      const { sort = "new", page = 1, limit = 5, search = "" } = req.query;
      const sortOption =
        sort === "popular" ? { viewsCount: -1 } : { createdAt: -1 };

      const query = search ? { title: { $regex: search, $options: "i" } } : {};

      const posts = await PostModel.find(query)
        .sort(sortOption)
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .populate("user")
        .exec();

      const totalPosts = await PostModel.find(query).count();
      const postsWithCommentsCount = await Promise.all(
        posts.map(async (post) => {
          const commentsCount = await CommentModel.find({
            post: post._id,
          }).count();
          return {
            ...post.toObject(),
            commentsCount,
          };
        })
      );

      res.json({
        posts: postsWithCommentsCount,
        totalPosts,
        totalPages: Math.ceil(totalPosts / limit),
        currentPage: parseInt(page),
      });
    } catch (err) {
      next(ApiError.BadRequest("Не удалось получить статьи"));
    }
  }

  async getOne(req, res, next) {
    try {
      const postId = req.params.id;
      PostModel.findOneAndUpdate(
        { _id: postId },
        { $inc: { viewsCount: 1 } },
        { returnDocument: "after" },
        (err, doc) => {
          if (err) {
            return next(ApiError.BadRequest("Не удалось вернуть статью"));
          }
          if (!doc) {
            return next(ApiError.BadRequest("Статья не найдена"));
          }
          res.json(doc);
        }
      ).populate("user");
    } catch (err) {
      next(ApiError.BadRequest("Не удалось получить статьи"));
    }
  }

  async remove(req, res, next) {
    try {
      const postId = req.params.id;
      PostModel.findOneAndDelete({ _id: postId }, (err, doc) => {
        if (err) {
          return next(ApiError.BadRequest("Не удалось удалить статью"));
        }
        if (!doc) {
          return next(ApiError.BadRequest("Статья не найдена"));
        }
        res.json({ success: true });
      });
    } catch (err) {
      next(ApiError.BadRequest("Не удалось получить статьи"));
    }
  }

  async create(req, res, next) {
    try {
      const { title, text } = req.body;
      if (!title || !text || !req.userId) {
        console.error("Отсутствуют обязательные поля:", {
          title,
          text,
          userId: req.userId,
        });
        ApiError.BadRequest("Поля title, text и user обязательны");
      }
      const doc = new PostModel({
        title: req.body.title,
        text: req.body.text,
        imageUrl: req.body.imageUrl,
        modelUrl: req.body.modelUrl,
        textureUrl: req.body.textureUrl,
        tags: req.body.tags,
        user: req.userId,
      });
      const post = await doc.save();
      res.json(post);
    } catch (err) {
      next(ApiError.BadRequest("Не удалось создать статью"));
    }
  }

  async update(req, res, next) {
    try {
      const postId = req.params.id;
      await PostModel.updateOne(
        { _id: postId },
        {
          title: req.body.title,
          text: req.body.text,
          imageUrl: req.body.imageUrl,
          modelUrl: req.body.modelUrl,
          textureUrl: req.body.textureUrl,
          user: req.userId,
          tags: req.body.tags,
        }
      );
      res.json({ success: true });
    } catch (err) {
      next(ApiError.BadRequest("Не удалось обновить статью"));
    }
  }

  async likePost(req, res, next) {
    try {
      const postId = req.params.id;
      const userId = req.userId;

      const post = await PostModel.findById(postId).populate("user");
      if (!post) {
        return next(ApiError.BadRequest("Статья не найдена"));
      }

      if (post.likes.includes(userId)) {
        post.likes = post.likes.filter((id) => id.toString() !== userId);
        post.likeCount = Math.max(0, post.likeCount - 1);
      } else {
        post.likes.push(userId);
        post.likeCount += 1;
      }

      await post.save();

      const commentsCount = await CommentModel.countDocuments({ post: postId });

      res.json({ ...post.toObject(), commentsCount });
    } catch (err) {
      next(ApiError.BadRequest("Не удалось обновить лайк"));
    }
  }

  async getComments(req, res, next) {
    try {
      const postId = req.params.id;
      const comments = await CommentModel.find({ post: postId })
        .populate("user")
        .exec();
      res.json(comments);
    } catch (err) {
      next(ApiError.BadRequest("Не удалось получить комментарии"));
    }
  }

  async addComment(req, res, next) {
    try {
      const { text } = req.body;
      const userId = req.userId;
      const postId = req.params.id;

      if (!text || !userId || !postId) {
        return next(ApiError.BadRequest("Все поля обязательны"));
      }

      const comment = new CommentModel({ text, user: userId, post: postId });
      await comment.save();

      const populatedComment = await comment.populate("user").execPopulate();

      res.json(populatedComment);
    } catch (err) {
      next(ApiError.BadRequest("Не удалось добавить комментарий"));
    }
  }

  async deleteComment(req, res, next) {
    try {
      const commentId = req.params.id;
      const userId = req.userId;

      const comment = await CommentModel.findById(commentId);
      if (!comment) {
        return next(ApiError.BadRequest("Комментарий не найден"));
      }

      if (comment.user.toString() !== userId) {
        return next(
          ApiError.Forbidden("Вы не можете удалить этот комментарий")
        );
      }

      await CommentModel.deleteOne({ _id: commentId });
      res.json({ success: true });
    } catch (err) {
      next(ApiError.BadRequest("Не удалось удалить комментарий"));
    }
  }
}

module.exports = new PostController();
