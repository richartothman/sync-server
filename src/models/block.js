const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = Schema.ObjectId

const revisionSchema = new mongoose.Schema({
  updatedAt: {
    type: Date,
    required: true
  },
  contentId: {
    type: ObjectId,
    required: true
  },
  blockTitle: {
    type: String,
    required: true
  },
  author: {
    type: String,
    require: true
  }
})

const blockSchema = new mongoose.Schema({
  blockId: {
    type: ObjectId,
    required: true
  },
  articleId: {
    type: ObjectId,
    required: true
  },
  revisions: [revisionSchema]
})

const block = mongoose.model('Block', blockSchema, 'Blocks')
module.exports = block
