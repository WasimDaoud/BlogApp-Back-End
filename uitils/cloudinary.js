const cloudinary = require("cloudinary").v2;

// 1- config()    ( cloudName , Api-key , Api-secret)
cloudinary.config({
  cloud_name: "dob7jm2fa",
  api_key: "246492543298176",
  api_secret: "mW1bmzPCKmer-4dmgpcRzEJZIn0",
});

// 2- Cloudinary-upload-image     async function( fileToUpload )
const cloudinaryUploadImage = async (fileToUpload) => {
  try {
    const data = await cloudinary.uploader.upload(fileToUpload); // return data( url , publicUrl ...)
    return data;
  } catch (error) {
    console.log(error);
    throw new Error("internal server error ( cloudinary )");
    }
};

// 3- Cloudinary-delete-image     async function( PublicId )
const cloudinaryDeletedImage = async (imagePublicId) => {
  try {
    const result = await cloudinary.uploader.destroy(imagePublicId);
    return result;
  } catch (error) {
    console.log(error);
    throw new Error("internal server error ( cloudinary )");  }
};


// 3- Cloudinary-delete-multiple-image     async function( PublicId )
const cloudinaryDeleteMultipleImages = async (arrayOfPublicIds) => {    // every value in this array must be public-Id
  try {
    const result = await cloudinary?.v2.api?.delete_resources(arrayOfPublicIds);
    return result;
  } catch (error) {
    console.log(error);
    throw new Error("internal server error ( cloudinary )");  }
};

module.exports = { cloudinaryUploadImage, cloudinaryDeletedImage , cloudinaryDeleteMultipleImages };
