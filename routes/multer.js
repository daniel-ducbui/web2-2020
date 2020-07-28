const User = require('../services/user');
const Account = require('../services/account');
const bodyParser = require('body-parser');
const router = require('express').Router();
const asyncHandler = require('express-async-handler');
const multer = require('multer');
var fileupload = require('express-fileupload')
router.use(fileupload({
    useTempFiles:true
}))
const cloudinary = require("cloudinary").v2;
// Set The Storage Engine
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function(req, file, cb) {
    console.log(file)
    cb(null, file.originalname)
  }
});

cloudinary.config({
    cloud_name: 'hvcg-company',
    api_key: '794948648774347',
    api_secret: 'rL1mGGSMO81nmMBzJq7j7TaeLLs'
});
// Init Upload
const upload = multer({
    storage: storage,
    limits: { fileSize: 1000000 },
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
}).single('myImage');

// Check File Type

router.get('/', (req, res) => res.render('pages/profile'));

router.post('/upload', (req, res) => {
    // collected image from a user
      const file = req.files.image;
      console.log(req.files)
    console.log(file.tempFilePath)

    // upload image here
    cloudinary.uploader.upload(file.tempFilePath)
    .then((result) => {
      User.update({
        idCardPhoto: result.secure_url,
        }, { 
            where: { 
                id: req.session.userId } });
        res.redirect('/multer')
    }).catch((error) => {
      res.status(500).send({
        message: "failure",
        error,
      });
    });
});

module.exports = router;