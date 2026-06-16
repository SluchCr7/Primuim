
const multer = require("multer");

const photoUpload = multer({
  storage: multer.memoryStorage(), 
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image")) cb(null, true);
    else cb(new Error("Only image files allowed!"), false);
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

module.exports = {
  single: (...args) => photoUpload.single(...args),
  array: (...args) => photoUpload.array(...args),
  fields: (...args) => photoUpload.fields(...args),
  none: (...args) => photoUpload.none(...args),
  any: (...args) => photoUpload.any(...args)
};
