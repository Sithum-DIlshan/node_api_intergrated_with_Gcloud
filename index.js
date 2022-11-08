const { format } = require('util');
const express = require('express');
const Multer = require('multer');
const mongoose = require("mongoose");
const app = express();

const { Storage } = require('@google-cloud/storage');
const BucketFiles = require('./modal/bucket.file.model')

// Instantiate a storage client
// const storage = new Storage();
const storage = new Storage({
  projectId: 'ferrous-pattern-357315',
  keyFilename: 'key.json'
})
mongoose.connect(
  'mongodb+srv://sithumdilshan:sithum24@cluster0.ivv5nn8.mongodb.net/sentura?retryWrites=true&w=majority'
);
const con = mongoose.connection



con.on('error', console.error.bind(console, "connection error: "));
con.once("open", function () {
  console.log("Connected successfully");
});

app.use(express.json());



const multer = Multer({
  storage: Multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // no larger than 5mb, you can change as needed.
  },
});

app.post('/upload', multer.single('file'), async (req, res, next) => {
  console.log(req.query);
  if (!req.file) {
    res.status(400).send('No file uploaded.');
    return;
  }

  await storage
    .createBucket(req.query.bucketName)
    .then(() => {
      console.log(`Bucket created.`);
    })
    .catch(err => {
      console.error('ERROR:', err);
    });

  // Create a new blob in the bucket and upload the file data.
  const bucket = storage.bucket(req.query.bucketName);
  bucket.makePublic();

  const blob = bucket.file(req.file.originalname);
  const blobStream = blob.createWriteStream();

  blobStream.on('error', err => {
    next(err);
  });

  blobStream.on('finish', () => {
    // The public URL can be used to directly access the file via HTTP.
    const publicUrl = format(
      `https://storage.googleapis.com/${bucket.name}/${blob.name}`
    );
    const files = new BucketFiles({
      bucketName: req.query.bucketName,
      pathToFile: publicUrl,
      blobName: blob.name
    })
    const response = files.save();

    res.status(200).send(publicUrl);
  });

  blobStream.end(req.file.buffer);
});



app.get('/', async (req, res, next) => {

  // await bucket.getFiles()
  const [files] = await storage.bucket(req.query.bucketName).getFiles()
  // res.send(files);
  const bucket = await BucketFiles.findOne({ 'bucketName': req.query.bucketName })
  res.json(bucket);


});

app.delete('/', async (req, res, next) => {

  const bucket = await BucketFiles.findOne({ 'bucketName': req.query.bucketName })
  bucket.delete();

  const bucketToDelete = await storage.bucket(req.query.bucketName);
  try {
    await bucketToDelete.deleteFiles();
    const rs = await bucketToDelete.delete();
    res.send("Deleted")
  } catch (err) {

  } 



});




const PORT = parseInt(process.env.PORT) || 8080;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
  console.log('Press Ctrl+C to quit.');
});
