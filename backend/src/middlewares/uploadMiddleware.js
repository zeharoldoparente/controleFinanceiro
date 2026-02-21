const multer = require("multer");
const path = require("path");
const crypto = require("crypto");

const storage = multer.diskStorage({
   destination: function (req, file, cb) {
      cb(null, "uploads/");
   },
   filename: function (req, file, cb) {
      const uniqueName = crypto.randomBytes(16).toString("hex");
      const extension = path.extname(file.originalname);
      cb(null, `${uniqueName}${extension}`);
   },
});

const fileFilter = (req, file, cb) => {
   const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
   ];

   if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
   } else {
      cb(
         new Error("Tipo de arquivo inválido. Apenas imagens são permitidas."),
         false,
      );
   }
};

const upload = multer({
   storage: storage,
   fileFilter: fileFilter,
   limits: {
      fileSize: 5 * 1024 * 1024,
   },
});

module.exports = upload;
