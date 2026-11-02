import multer from "multer";

const storage = multer.memoryStorage();

const upload = multer({
    storage,

    limits:{
        fileSize: 15 * 1024 * 1024
    },

    fileFilter(req, file, cb){
        const allowed = [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp"
        ];

        if(!allowed.includes(file.mimetype.toLowerCase())){
            return cb(new Error("ONLY JPG, JPEG, PNG, WEBP ARE ALLOWED"));
        }

        cb(null, true);
    }
});

export default upload;