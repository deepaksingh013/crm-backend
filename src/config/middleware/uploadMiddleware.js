import multer from "multer";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedExtensions = [".xlsx", ".xls"];

  const fileName = file.originalname.toLowerCase();

  const isValid = allowedExtensions.some((ext) =>
    fileName.endsWith(ext)
  );

  if (!isValid) {
    return cb(
      new Error("Only Excel files (.xlsx, .xls) are allowed")
    );
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
});

export default upload;