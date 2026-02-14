import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    authorName: String,
    content: {
        type: String,
        required: true
    },
    upvotes: {
        type: Number,
        default: 0
    },
    isTop: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const postSchema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    authorName: String,
    authorRole: String,
    authorAvatar: String,
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    tags: [String],
    upvotes: {
        type: Number,
        default: 0
    },
    views: {
        type: Number,
        default: 0
    },
    answers: [answerSchema],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('Post', postSchema);
