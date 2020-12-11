const express = require("express");
const fs = require("fs");
const path = require("path");

const HttpError = require("./models/http-error");
const mongoose = require("mongoose");

const placesRoutes = require("./routes/places-routes");
const usersRoutes = require("./routes/users-routes");

const app = express();

app.use(express.json());

app.use("/uploads/images", express.static(path.join("uploads", "images")));
app.use(express.static(path.join("public")));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");
  next();
});

app.use("/api/places", placesRoutes);

app.use("/api/users", usersRoutes);

app.use((req, res, next) => {
  res.sendFile(path.resolve(__dirname, "public", "index.html"));
});

// app.use((req, res, next) => {
//   if (req.file) {
//     fs.unlink(req.file.path, (err) => {
//       console.log(err);
//     });
//   }
//   const error = new HttpError("Could not find this route", 404);
//   throw error;
// });

app.use((error, req, res, next) => {
  if (res.headerSent) {
    return next(error);
  }
  res.status(error.code || 500);
  res.json({ message: error.message || "An unknown error occured" });
});

mongoose
  .connect(
    `mongodb://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0-shard-00-00.kyz02.mongodb.net:27017,cluster0-shard-00-01.kyz02.mongodb.net:27017,cluster0-shard-00-02.kyz02.mongodb.net:27017/${process.env.DB_NAME}?ssl=true&replicaSet=atlas-72j8yq-shard-0&authSource=admin&retryWrites=true&w=majority`,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
    }
  )
  .then(() => {
    app.listen(process.env.PORT || 5000, () => {
      console.log("MongoDB Connected..Connection Started at 5000");
    });
  })
  .catch((err) => {
    console.log(err);
  });
