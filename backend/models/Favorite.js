const mongoose = require('mongoose')

const favoriteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    suggestion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Suggestion',
      required: true
    }
  },
  { timestamps: true }
)

favoriteSchema.index({ user: 1, suggestion: 1 }, { unique: true })
favoriteSchema.index({ user: 1, createdAt: -1 })

module.exports = mongoose.model('Favorite', favoriteSchema)
