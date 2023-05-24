const User = require("../models/User");
const bcrypt = require("bcryptjs");
const validator = require("validator");
const Comment = require("../models/Comment");
const fs = require("fs");
const path = require("path");
const Post = require("../models/Post");

const {
  cloudinaryUploadImage,
  cloudinaryDeletedImage,
  cloudinaryDeleteMultipleImages
} = require("../uitils/cloudinary");



/****************************************/
// description : GET ALL USERS PROFILES
//      method : GET
//       route : api/users/profile
//      access : PUBLIC
/****************************************/
const getAllUsersCtrl = async (req, res) => {
  try {
    // get all data of users without password
    const users = await User.find().select("-passWord");
    res.status(200).json(users);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};



/****************************************/
// description : GET USERS COUNT
//      method : GET
//       route : api/users/count
//      access : PUBLIC
/****************************************/
const getUsersCountCtrl = async (req, res) => {
  try {
    // get users count
    const count = await User.count();
    res.status(200).json(count);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};



/**********************************************/
// description : GET SINGLE USER PROFILE
//      method : GET
//       route : api/users/profile/:id
//      access : public
/**********************************************/
const getSingleProfileCtrl = async (req, res) => {
  try {
    // get all data of user without password
    const user = await User.findById(req.params.id).populate("posts");//.select("-passWord")
    if (!user) {
      res.status(404).json({ message: "user not found" });
    } else {
      res.status(200).json({ user });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};



/**********************************************/
// description : UPDATE SINGLE USER PROFILE
//      method : PUT
//       route : api/users/profile/:id
//      access : only profile owner
/**********************************************/
const updateProfile = async (req, res) => {
  if (req.tokenPayload._id === req.params.id) {
    try {
      // check if user want to update PassWord
      if (req.body.passWord) {
        // validation & hash Password
        if (validator.isStrongPassword(req.body.passWord)) {
          const salt = await bcrypt.genSalt(10);
          hashPassWord = await bcrypt.hash(req.body.passWord, salt);
        } else {
          res.status(400).json({
            error:
              "passWord is not strong enough..add symbols,litters $ numbers ",
          });
        }
      }
      // validate Email
      const validateEmail = validator.isEmail(req.body.email);
      if (!validateEmail) {
        res.status(400).json({ error: "invalid email" });
      }
      // update user data
      const user = await User.findByIdAndUpdate(
        req.params.id,
        {
          $set: {
            userName: req.body.userName,
            passWord: hashPassWord,
            email: req.body.email,
            bio: req.body.bio,
          },
        },
        { new: true }
      ).select("-passWord");
      res.status(200).json({ user });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  } else {
    res.status(403).json({ error: "only profile owner can update it" });
  }
};



/**********************************************/
// description : DELETE SINGLE USER PROFILE
//      method : DELETE
//       route : api/users/profile/:id
//      access : private only( Admin & profile owner )
/**********************************************/
// there is too many things to do in future when we create posts
const deleteSingleProfileCtrl = async (req, res) => {
  try {
    // 1- get user from database
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404).json({ message: " user not found " });
    }
    // 2- get all posts that belong to this profile from database
    const posts = await Post.find({ user : user._id});

    // 3- get the public ids of posts
    const publicIds = posts?.map((post)=>post.image.publicId);       // if posts = null || undefined map will not continue 


    // 4- delete all posts image from cloudinary that belong to this profile
    if( publicIds?.length > 0 ){
      await cloudinaryDeleteMultipleImages( publicIds );
    } 

    // 5- delete profile picture from cloudinary
    if (user.profilePhoto?.publicId !== null) {                       // if profilePhoto = null || undefined "if" will not continue
      await cloudinaryDeletedImage(user.profilePhoto.publicId);
    }
    // 6- delete all user posts
    await Post.deleteMany({ user : user._id });

    // 7- ( todo later ) delete all user comments
    await Comment.deleteMany({ user : user._id });

    // 8- delete profile himself
    await User.findByIdAndDelete(req.params.id);

    // 9- send response to the client
    res.status(200).json({ message: "Profile has been deleted successfully" });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};



/**********************************************/
// description : UPLOAD-PROFILE-IMAGE
//      method : POST
//       route : api/users/profile/upload-profile-image
//      access : private only( logged-in )
/**********************************************/
const uploadImageCtrl = async (req, res) => {
  // 1- validation
  if (!req.file) {
    res.status(400).json({ message: "no photo provided " });
  }
  // 2- get the image path
  const imagePath = path.join(__dirname, `../images/${req.file.filename}`);

  // 3- upload image to cloudinary
  const result = await cloudinaryUploadImage(imagePath);

  // 4- get the user from DataBase
  const user = await User.findById(req.tokenPayload._id);

  // 5- delete old profile-image from cloudinary
  if (user.profilePhoto.publicId !== null) {
    await cloudinaryDeletedImage(user.profilePhoto.publicId);
  }

  // 6- change the profile-field in DataBase
  user.profilePhoto = {
    url: result.secure_url,
    publicId: result.public_id, // for delete it later if we need that
  };
  await user.save();

  // 7- send response to client
  res.status(200).json({
    message: "profile photo uploaded successfully",
    profilePhoto: {
      url: result.secure_url,
      publicId: result.public_id,
    },
  });

  // 8- remove photo from image folder       using "fs node-module"
  fs.unlinkSync(imagePath); // allow us to delete files whitch we upload it from file  system
};

module.exports = {
  getAllUsersCtrl,
  getSingleProfileCtrl,
  updateProfile,
  getUsersCountCtrl,
  deleteSingleProfileCtrl,
  uploadImageCtrl,
};
