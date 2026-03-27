const mongoose = require('mongoose')

const officialReplySchema = new mongoose.Schema(
  {
    content: { type: String, required: true },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    authorName: { type: String, default: '村干部' }
  },
  { timestamps: true, _id: false }
)

const suggestionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, '标题不能为空'],
      trim: true,
      maxlength: [100, '标题最多 100 个字符']
    },
    content: {
      type: String,
      required: [true, '内容不能为空']
    },
    category: {
      type: String,
      enum: ['环境', '教育', '医疗', '交通', '其他'],
      default: '其他'
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    authorName: { type: String, default: '匿名' },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    likesCount: { type: Number, default: 0 },
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    favoritesCount: { type: Number, default: 0 },
    isTop: { type: Boolean, default: false },
    officialReply: { type: officialReplySchema, default: null }
  },
  { timestamps: true }
)

suggestionSchema.index({ title: 'text', content: 'text' })
suggestionSchema.index({ authorId: 1, createdAt: -1 })
suggestionSchema.index({ status: 1, createdAt: -1 })

module.exports = mongoose.model('Suggestion', suggestionSchema)
