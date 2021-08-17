//All requirements
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const multer = require("multer");
const upload = multer();
const cors = require("cors");
const mongoose = require("mongoose");

const Schema = mongoose.Schema
//Connect to database
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true
});

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

//create person model
const personSchema = new Schema({ username: String})
const user = mongoose.model('user', personSchema)

//create excersise model
const exerciseSchema = new Schema(
  {
      userId: String,
      description: String,
      duration: Number,
      date: Date
    })
const exercise = mongoose.model('exercise', exerciseSchema)

//save user to database
app.post("/api/users", (req,res)=>{
  const newPerson = new user({username:req.body.username});
  newPerson.save((err,data)=>{
    if(err){
      res.json(err)
    }
    else{
      res.json({username: data.username, "_id": data._id})
    }
  })
});

//add excersise for specfic users to database
app.post("/api/users/:_id/exercises", (req,res) =>{
  const {userId, description, duration, date} = req.body;
  user.findById(userId, (err,data) =>{
    if(err){
      res.json(err)
    }
    if(!data){
      res.send("Unknown userId")
    }else{
      const username = data.username
      const newExercise = new exercise({userId, username, description, duration: +duration, date: new Date(date).toDateString()})
      newExercise.save((err,data)=>{
        if(err){
          res.json(err)
        }
        res.json({userId, username, description, duration: +duration, date: new Date(date).toDateString()})
      })
    }
  })
})

//get users excersises
//type this into url:
///api/users/{userId}/logs?userId={userId}
app.get("/api/users/:_id/logs", (req,res) => {
  const {userId} = req.query;
  user.findById(userId, (err,data)=>{
    if(err){
      res.json(err)
    }
    if(!data){
      res.send("Unknown userId")
    }else{
      const username = data.username
      exercise.find({userId: userId}).select(["id","description","duration","date"])
      .exec((err,data) =>{
        let output = data.map(exer =>{
          return {id: exer.id, description: exer.description, duration: exer.duration, date: new Date(exer.date).toDateString()}})
        if(err){
          res.json(err)
        }
        if(!data){
          res.json({
            "userId":userId,
            "username": username,
            "count": 0,
            "log": []})
        }else{
           res.json({
            "userId":userId,
            "username": username,
            "count": data.length,
            "log": output})
        }

        })
    }
  })
})

//get list of all users
app.get("/api/users", (req,res) =>{
  user.find({}, (err, data) =>{
    if(!data){
      res.json("no Users")
    }else{
      res.json(data)
    }
  })
})


// Not found middleware
app.use((req, res, next) => {
  return next({ status: 404, message: "not found" });
});

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage;

  if (err.errors) {
    // mongoose validation error
    errCode = 400; // bad request
    const keys = Object.keys(err.errors);
    // report the first validation error
    errMessage = err.errors[keys[0]].message;
  } else {
    // generic or custom error
    errCode = err.status || 500;
    errMessage = err.message || "Internal Server Error";
  }
  res
    .status(errCode)
    .type("txt")
    .send(errMessage);
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});


