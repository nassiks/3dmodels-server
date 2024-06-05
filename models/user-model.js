const {Schema, model} = require('mongoose');

const UserSchema = new Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    isActivated: {
        type: Boolean,
        default: false
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'researcher'],
        default: 'user'
    },
    activationLink: {type: String},
    avatarUrl: String,
}, {
    timestamps: true,
})

module.exports = model('User', UserSchema);
