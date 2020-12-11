const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const fs = require("fs");

const Place = require("../models/place");
const User = require("../models/users");
const HttpError = require("../models/http-error");

const getPlaceByID = async (req, res, next) => {
  const pid = req.params.pid;
  let data;
  try {
    data = await Place.findById(pid);
  } catch (err) {
    return next(new HttpError("Something Went Wrong", 500));
  }
  if (!data) {
    return next(new HttpError("Could not find the place", 404));
  }
  res.json({ place: data });
};

const getPlacesByUserID = async (req, res, next) => {
  const uid = req.params.uid;
  let userWithPlaces;
  try {
    userWithPlaces = await User.findById(uid).populate("places");
  } catch (err) {
    return next(new HttpError("Something went wrong", 500));
  }
  if (!userWithPlaces || userWithPlaces.places.length === 0) {
    return next(new HttpError("Could not find the place", 404));
  }
  res.json({
    places: userWithPlaces.places.map((place) =>
      place.toObject({ getters: true })
    ),
  });
};

const createPlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new HttpError("Invalid Erorr Inputs", 422);
  }
  const { title, description, address, creator } = req.body;
  const createdPlace = new Place({
    title,
    description,
    address,
    image: req.file.path,
    creator,
  });

  let user;
  try {
    user = await User.findById(creator);
  } catch (error) {
    return next(new HttpError("Creating Place failed, Please try again", 500));
  }

  if (!user) {
    return next(new HttpError("Could not find user by provided ID", 404));
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdPlace.save({ session: sess });
    user.places.push(createdPlace);
    await user.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError("Creating place failed, please try again", 500);
    return next(error);
  }
  res.status(201).send({ place: createdPlace });
};

const updatePlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }

  const { title, description } = req.body;
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update place.",
      500
    );
    return next(error);
  }

  if (place.creator.toString() !== req.userData.userId) {
    const error = new HttpError("You are not allowed to edit this place.", 401);
    return next(error);
  }

  place.title = title;
  place.description = description;

  try {
    await place.save();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update place.",
      500
    );
    return next(error);
  }

  res.status(200).json({ place: place.toObject({ getters: true }) });
};

const deletePlace = async (req, res, next) => {
  const placeId = req.params.pid;
  let place;
  try {
    place = await Place.findById(placeId).populate("creator");
  } catch (err) {
    return next(new HttpError("Something Went wrong", 500));
  }

  if (!place) {
    return next(new HttpError("Could not find the place by that id"), 404);
  }

  if (place.creator.id !== req.userData.userId) {
    return next(
      new HttpError("Your are not allowed to delete this place", 403)
    );
  }

  const imagePath = place.image;

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await place.remove({ session: sess });
    await place.creator.places.pull(place);
    await place.creator.save({ session: sess });
    await sess.commitTransaction();
  } catch (error) {
    return next(new HttpError("Something went wrong in deleting place", 500));
  }

  fs.unlink(imagePath, (err) => {
    console.log(err);
  });

  res.status(200).json({
    message: "DeletedPlace",
    place: place,
  });
};

exports.getPlaceByID = getPlaceByID;
exports.getPlacesByUserID = getPlacesByUserID;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
