var Article = require('../models/article')
const auth = require('../controllers/auth_controller')
const same = require('../controllers/same_controller')
// const mongoose = require('mongoose')
const jsonpatch = require('fast-json-patch')

const ObjectId = require('mongodb').ObjectId;

module.exports = {
  getArticles (req, res, next) {
    const keyword = req.query.q || ''
    const limit = Number(req.query.limit)
    console.log('getArticles: ' + keyword + ',' + limit)
    Article
      .find({
        $or: [{
          title: {
            $regex: keyword,
            $options: 'i'
          }
        }, {
          outline: {
            $regex: keyword,
            $options: 'i'
          }
        }]
      }, null, { limit: limit, sort: { _id: -1 } })
      .exec(
        (err, doc) => {
          if (err || doc.length === 0) {
            res.status(200).send({
              code: 404,
              type: 'success',
              message: '查無搜尋結果'
            })
          } else {
            res.json({
              code: 200,
              type: 'success',
              data: doc
            })
          }
        })
  },
  getArticleById (req, res, next) {
    console.log('getArticleById: ' + req.params.id)
    Article
      .findById(req.params.id)
      .exec(
        (err, doc) => {
          if (err) {
            res.status(500).send({
              code: 500,
              type: 'error',
              message: '文章的ID輸入有誤，請重新查詢'
            })
          } else {
            /* const newDoc = {
              tags: doc.tags,
              title: doc.title,
              blocks: doc.blocks,
              entityMap: doc.entityMap,
              timeStamp: doc.timeStamp
            } */
            res.json({
              code: 200,
              type: 'success',
              data: doc
            })
          }
        })
  },
  async createArticle (req, res, next) {
    console.log('createArticle')
    console.log(req.body)
    try {
      // const uid = await auth.verifyIdToken(req.body.token)
      // console.log('uid: ' + uid)
      const data = req.body
      const article = new Article({
        title: data.title,
        tags: data.tags,
        authors: data.authors,
        category: [],
        createAt: new Date(data.createAt),
        blocks: data.blocks
      })
      for (var block in article.blocks) {
        console.log({block})
        article.blocks[block]["blockRevision"] = 1
        console.log(article.blocks[block]["blockRevision"])
        console.log(article.blocks[block]["content"])
      }
      // article.blocks = article.blocks.map((val)=>　({...val, blockRevision:123}))
      console.log("############")
      console.log(article)
      console.log("############")
      // 需要對uid進行log寫入

      await article.save().then(result => {
        console.log(result)
        res.status(200).send({
          code: 200,
          type: 'success',
          message: '成功發布新文章',
          id: result.id
        })
        return Promise.resolve()
      }).catch(error => {
        res.status(200).send({
          code: 500,
          type: 'error',
          message: '請輸入標題'
        })
        return Promise.reject(error)
      })
    } catch (error) {
      console.log(error)
      res.status(500).send({
        code: 500,
        type: 'error',
        message: error.message
      })
    }
  },
  async updateArticleById (req, res, next) {
    console.log('updateArticleById: ' + req.body.id)

    try {
      // 使用者登入用
      // const uid = await auth.verifyIdToken(req.body.token)
      // console.log('uid: ' + uid)
      const id = req.body.id
      console.log(id)
      // JsonPatch http://jsonpatch.com/
      // 需要實作判斷更新功能
      // const patches = req.body.blocks

      var article = await Article.findById(id).lean()
      console.log(article)
      article.blocks.bloc
      if (article === undefined) {
        console.log(article)
        res.status(200).send({
          code: 500,
          type: 'error',
          message: '文章的ID輸入有誤，請重新查詢'
        })
      } else {
        // var errors = jsonpatch.validate(patches, article)
        var errors = undefined
        if (errors === undefined) {
          // var updateObj = jsonpatch.applyPatch(article, patches).newDocument
          var updateObj = req.body
          for (var block in updateObj["blocks"]) {
            // if (updateObj["blocks"][block].hasOwnProperty("blockRevision")) {
            //   updateObj["blocks"][block]["blockRevision"] += 1
            // }
            // else
            //   updateObj["blocks"][block]["blockRevision"] = 1
            // updateObj["blocks"][block]["blockTitle"] = "華視"
            // console.log(updateObj)
            if( !await same.compareContent(updateObj["blocks"][block]["content"]["content"][0]["content"][0]["text"], article["blocks"][block]["content"]["content"][0]["content"][0]["text"]))
              updateObj["blocks"][block]["blockRevision"] += 1
          }
          Article.findOneAndUpdate({ _id: id }, updateObj, { new: true, upsert: true }, (err, doc) => {
            if (err) {
              res.status(200).send({
                code: 500,
                type: 'error',
                message: '更新文章時發生錯誤'
              })
              return
            }
            res.json({
              code: 200,
              type: 'success',
              data: doc,
              message: '已成功更新文章'
            })
            module.exports.updateArticleEditingCount(id)
          })
        } else {
          console.log(errors)
          res.status(200).send({
            code: 500,
            type: 'error',
            message: errors.message
          })
        }
      }
    } catch (error) {
      console.log(error)
      res.status(200).send({
        code: 500,
        type: 'error',
        message: error.message
      })
    }
  },
  updateArticleEditingCount (articleId) {
    Article.findOneAndUpdate({ _id: articleId }, { $inc: { editedCount: 1 } }, { new: true, upsert: true }, (err, doc) => {
      if (err) {
        console.log(err)
      } else {
        console.log(doc)
        console.log('已更新', articleId)
      }
    })
  }
}
