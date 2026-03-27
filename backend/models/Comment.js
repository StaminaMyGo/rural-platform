const mongoose = require('mongoose')

const commentSchema = new mongoose.Schema(
  {
    suggestion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Suggestion',
      required: true
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    authorName: { type: String, default: '匿名' },
    content: {
      type: String,
      required: [true, '评论内容不能为空'],
      maxlength: [500, '评论最多 500 个字符']
    }
  },
  { timestamps: true }
)

commentSchema.index({ suggestion: 1, createdAt: 1 })

module.exports = mongoose.model('Comment', commentSchema)
