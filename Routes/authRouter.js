const express = require("express");
const router = express.Router();
const { Register, Login } = require("../controllers/authController");
const photoUpload = require("../middleWares/photoUpload");


// Register
router.post("/register", photoUpload.single("image") , Register);

// Login
router.post("/login", Login);

module.exports = router;
