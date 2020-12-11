const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const HttpError = require("../models/http-error");
const User = require("../models/users");

const getAllUsers = async (req, res, next) => {
  let allUsers;
  try {
    allUsers = await User.find({}, "-password");
  } catch (error) {
    return next(
      new HttpError("Something went wrong, Getting All Users failed", 500)
    );
  }
  res
    .status(201)
    .json({ users: allUsers.map((user) => user.toObject({ getters: true })) });
};

const signUp = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid Erorr Inputs", 422));
  }
  const { name, email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email });
  } catch (err) {
    return next(new HttpError("Something went wrong", 500));
  }
  if (existingUser) {
    return next(new HttpError("Email already axist", 422));
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    return next(
      new HttpError("Signing up failed, please try again later", 500)
    );
  }

  const createUser = new User({
    name,
    email,
    image: req.file.path,
    password: hashedPassword,
    places: [],
  });

  try {
    await createUser.save();
  } catch (error) {
    return next(new HttpError("Something went wrong", 500));
  }

  let token;
  try {
    token = jwt.sign(
      {
        userId: createUser.id,
        email: createUser.email,
      },
      process.env.JWT_KEY,
      { expiresIn: "1hr" }
    );
  } catch (err) {
    return next(new HttpError("Something went wrong", 500));
  }

  res
    .status(201)
    .json({ userId: createUser.id, email: createUser.email, token: token });
};

const loginIn = async (req, res, next) => {
  const { email, password } = req.body;
  let existingUser;
  try {
    existingUser = await User.findOne({ email });
  } catch (err) {
    return next(new HttpError("Something went wrong, Logging In failed", 500));
  }
  if (!existingUser) {
    return next(
      new HttpError(
        "Could not find the identity user, credentials seem to be wrong.",
        401
      )
    );
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (err) {
    return next(
      new HttpError("Logging up failed, Please check your credential", 500)
    );
  }

  if (!isValidPassword) {
    return next(
      new HttpError(
        "Could not find the identity user, credentials seem to be wrong.",
        401
      )
    );
  }

  let token;
  try {
    token = jwt.sign(
      {
        userId: existingUser.id,
        email: existingUser.email,
      },
      process.env.JWT_KEY,
      { expiresIn: "1hr" }
    );
  } catch (err) {
    return next(
      new HttpError("Logging up failed, Please check your credential", 500)
    );
  }

  res.status(201).json({
    userId: existingUser.id,
    email: existingUser.email,
    token: token,
  });
};

exports.getAllUsers = getAllUsers;
exports.loginIn = loginIn;
exports.signUp = signUp;
