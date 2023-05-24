// const jwt = require("jsonwebtoken");
const User = require("../models/User");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const path = require("path");
const { cloudinaryUploadImage } = require("../uitils/cloudinary");

//************  REGISTER-CONTROLLER ***************/
// RegisterHandler method for (validation & checking-Fields & hashing-passWord)
const RegisterHandler = async (userName, passWord, email) => {
  // check if there any empty field
  if (!userName || !email || !passWord) {
    throw Error("all Fields are Required");
  }

  // validation
  // email validation
  if (!validator.isEmail(email)) {
    throw Error("invalid Email");
  }
  // passWord validation
  if (!validator.isStrongPassword(passWord)) {
    throw Error("Weak password please Add symbols,letters and numbers please");
  }
  // check if this Email is already exist or not
  const user = await User.findOne({ email });
  if (user) {
    throw Error("this Email is already exist");
  }
  // hashing the PassWord
  const salt = await bcrypt.genSalt(10);
  const hashPassWord = await bcrypt.hash(passWord, salt);
  // create a new user
  const newUser = await User.create({
    userName,
    email,
    passWord: hashPassWord,
  });
  return newUser;
};

// Register Controller
const Register = async (req, res) => {
  const { userName, passWord, email } = req.body;
  try {
    // register user
    const user = await RegisterHandler(userName, passWord, email);

    // send userData & token
    res
      .status(200)
      .json({ user, message: "You Registered successfully , Please LogIn " });
  } catch (error) {
    res.status(400).json( error.message );
  }
};
/*********************************************************************/

//**********************  LOG-IN-CONTROLLER **************************/
// Login method for (checking-Fields & hashing-passWord)
const LoginHandler = async (email, passWord) => {
  // check if there any empty field
  if (!email || !passWord) {
    throw Error("all Fields must be filled");
  }
  // check if this Email is exist or not
  const user = await User.findOne({ email });
  if (!user) {
    throw Error("Incorrect Email");
  }
  // check if the PassWord correct
  const matched = await bcrypt.compare(passWord, user.passWord);
  if (!matched) {
    throw Error("Incorrect PassWord");
  }
  return user;
};

// Login Controller
const Login = async (req, res) => {
  const { email, passWord } = req.body;
  try {
    // (checking & hashing-passWord) using LoginHandler
    const user = await LoginHandler(email, passWord);
    // generating a token
    const token = jwt.sign(
      { _id: user._id, isAdmin: user.isAdmin },
      process.env.SECRETKEY
    );
    // send userData & token to client
    res.status(200).json({ user, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = { Register, Login };
