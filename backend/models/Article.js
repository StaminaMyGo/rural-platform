const mongoose = require('mongoose')

const articleSchema = new mongoose.Schema(
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
    summary: {
      type: String,
      maxlength: [200, '摘要最多 200 个字符']
    },
    category: {
      type: String,
      default: '未分类',
      trim: true
    },
    author: {
      type: String,
      default: '匿名'
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { timestamps: true }
)

// 全文搜索索引
articleSchema.index({ title: 'text', content: 'text', summary: 'text' })

module.exports = mongoose.model('Article', articleSchema)
