const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')

const mongoose = require('mongoose')
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

let db = mongoose.connection;
db.on('error', console.error.bind("connection error"));
db.once('open', () => console.log("we're in!"));

app.use(cors())
app.use("", bodyParser.urlencoded({"extended":false}));


app.use(bodyParser.json());


app.use(express.static('public'));

app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${req.ip}`);
  next();
})

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


// Not found middleware


// app.use((req, res, next) => {
//   return next({status: 404, message: 'not found'})
// })


// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

let personSchema = new mongoose.Schema({
  username: String,

  exercise: [{ description: {type: String, default: ""},
              duration: {type: Number, default: 0},
              date: {type : Date, default: Date.now} }]
  
});

let Person = mongoose.model("Person", personSchema);

const createPerson = (name, done) => {
  let objPerson = new Person({
    username: name
  });
  objPerson.save((err, data) => {
    if(err) {
      return console.error(err);
    }
    console.log("save successfully");
    done(null, data);
  
  }); 

};

var findPersonAndUpdate = (id, 
    Ndescription = "blank",
  Nduration = 0,
  Ndate = Date.now,
  done) => {
    let updater = { description : Ndescription, duration: Nduration, date: Ndate};
    Person.findOneAndUpdate(
      {'_id':id},
      { $push : {exercise: updater}},
      (err, people) => {
      if(err) {
        console.error(err);
        } 
      console.log("update successfully");
      done(null, people);
      }
    );
  }; 


app.post("/api/exercise/new-user", (req, res, done) => {
  console.log(req.body);
  
  const checkID = new Promise((resolve, reject) => {
    const checker = Person.exists({username: req.body.username});
    if(checker) {
      resolve(checker);
    } else {
      reject("USERNAME ALREADY EXISTS!")
    }
  }).then(result => {
    console.log(`Does this username already exist? ${result}`);
    if(!result) {
      createPerson(req.body.username, (err, people) => {
        if(err) return console.error(err);
        console.log("create successfully!");
        res.json({
        "username": people.username,
        "_id": people._id});
        done(null, people);
  })
    } else {
      res.json({"error":"This username already exists!"});
    }
  })
});
  
app.post("/api/exercise/add", (req, res, done) => { 
  console.log(req.body);
  const check_ID = new Promise((resolve, reject) => {
    const checker = Person.exists({_id: req.body.userId});
    if(checker) {
      resolve(checker);
    } else {
      reject("userID is invalid");
    } 
  }).then(result => {
    console.log(`Does this ID exists? ${result}`);
    if(result) {
      console.log("We is here");
      findPersonAndUpdate(req.body.userId, 
      req.body.description,
      req.body.duration,
      req.body.date,
      (err, people) => {
        if(err) return console.error(err);
        console.log('We here');
        res.json(people);
        done(null, people);
      });
    } else {
      res.json({"error":"This USERNAME doesn't exists!"})
    }
  }).catch(error => { console.log(error);});

});

app.get("/api/exercise/users", async (req, res, done) => {
  let listOfUsers = await Person.find({});
  res.json(listOfUsers);
})
 
const listener = app.listen(8080, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
