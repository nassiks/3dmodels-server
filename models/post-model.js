const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
        },
        text: {
            type: String,
            required: true,
            unique: true,
        },
        tags: {
            type: Array,
            default: [],
        },
        viewsCount: {
            type: Number,
            default: 0,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        likes: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        }],
        likeCount: {
            type: Number,
            default: 0,
        },
        imageUrl: String,
        modelUrl: String,
        textureUrl: String,
        modelsPath: String,
    },
    {
        timestamps: true,
    },
);

module.exports = mongoose.model('Post', PostSchema);
