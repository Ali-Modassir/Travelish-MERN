const express = require("express");
const router = express.Router();
const { check } = require("express-validator");

// const HttpError = require("../models/http-error");
const usersControllers = require("../controllers/users-controllers");
const fileUpload = require("../middleware/file-upload");

router.post(
  "/signup",
  fileUpload.single("image"),
  [
    check("name").not().isEmpty(),
    check("email").normalizeEmail().isEmail(),
    check("password").isLength({ min: 6 }),
  ],
  usersControllers.signUp
);

router.post("/login", usersControllers.loginIn);

router.get("/", usersControllers.getAllUsers);

module.exports = router;
