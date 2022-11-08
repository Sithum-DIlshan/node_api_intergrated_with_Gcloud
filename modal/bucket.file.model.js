const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const fileSchema = new Schema({
    bucketName: {
        type: String
    },
    pathToFile: {
        type: String
    },
    blobName: {
        type: String
    }
})

module.exports = mongoose.model('BucketFiles', fileSchema)