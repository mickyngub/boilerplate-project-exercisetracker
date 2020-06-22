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

  exercise: { description: String,
              duration: Number,
              date: {type : Date, default: Date.now} }
  
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

}
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
        res.json({"status":"successfully created!"});
        done(null, people);
  })
    } else {
      res.json({"error":"This username already exists!"});
    }
  })
  

 
});
const listener = app.listen(8080, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
