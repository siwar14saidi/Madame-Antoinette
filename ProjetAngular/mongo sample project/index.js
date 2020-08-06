const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
var cors = require('cors')
const bcrypt = require('bcryptjs');
const Quote = require("./model/quotes");
const User = require('./model/users');
const app = express();
app.use(bodyParser.json());

app.use(cors())

// Connection à la base MongoDB
mongoose.connect("mongodb://localhost:27017/quotes", { useNewUrlParser: true, useUnifiedTopology: true });
const connection = mongoose.connection;

// Dès que la connection à la base est établie, affichage d'un message
connection.once("open", function () {
  console.log("MongoDB database connection established successfully");
});

// Créer et sauvegarder un nouveau utilisateur
app.post('/register', (req, res) => {
  console.log(req.body)
  User.find({
    email: req.body.email.trim().toLowerCase()
  }).then(users => {
    if (users.length < 1) {
      bcrypt.hash(req.body.password.trim(), 10, function (err, hash) {
        const user = new User({
          email: req.body.email.trim().toLowerCase(),
          password: hash,
        });
        user.save().then(function (result) {
          res.json({ success: true });
        })
      })
    }
    else {
      res.status(500).send("error");
    }
  }).catch(err => {
    res.status(500).send("error");
  });
});

/////////////////////////////////LOGIN
app.post('/login', (req, res) => {
  User.findOne({ email: req.body.email.trim().toLowerCase() }) // (trim) "   dsfsdf   " ==> "dsfsdf"
    .exec()
    .then(function (user) {
      bcrypt.compare(req.body.password, user.password, function (err, result) {
        if (err) {
          return res.status(401).json({
            success: false,
            failed: 'Unauthorized Access'
          });
        } else if (result) {
          return res.status(200).json({
            success: true,
            _id: user._id,
            email: user.email,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
          });
        } else {
          return res.status(402).json({
            success: false,
            failed: 'password'
          });
        }
      });
    })
    .catch(error => {
      console.log(error)
      res.status(200).json({
        success: false,
        failed: 'email'
      });
    });
});

// /quotes/:userid pour recevoir les proverbes d'un user qui les a aimé
app.get('/quotes/:userId', async (req, res) => {
  // nekhdhou les jaimes mta3 un user
  try {
    const user = await User.findById(req.params.userId);
    let qq = [];
    for (let i = 0; i < user.quotes.length; ++i) {
      const q = await Quote.findById(user.quotes[i]._id);
      qq.push({
        _id: q._id,
        name: q.name
      });
    }
    res.json(qq);
  } catch (err) {
    console.log(err);
    res.status(403).json({
      failed: 'user'
    });
  }
})

app.get('/addlike/:userId/:quoteId', (req, res) => {
  // il faut tester ken fama user 3andou userId comme id
  // il faut tester zeda ken fama quote 3andou quoteId comme id
  // il faut tester ken el user 3amel jaime deja lel quote hadhika
  User.findOne({ _id: req.params.userId })
    .then(user => { // cbon l9it el user
      Quote.findById(req.params.quoteId)
        .then(quote => { // cbon l9it el quote
          var test = true;
          user.quotes.forEach(q => { // nparcouriw kol jomla hatina 3liha jaime w nchoufou ken el jomla jdida mawjouda deja
            if (test && JSON.stringify(q._id) === JSON.stringify(quote._id)) { // rahou deja 3amel j'aime 3liha
              test = false; // bch tokhrej
            }
          })
          if (test == true) {
            // jawna mrigl houni juste nzid el quoteId lel tableau mta3 el user
            user.quotes.push(req.params.quoteId);
            user.save().then((result) => { // bch nsauvegardiw les changements fel base
              res.json({ success: true });
            }).catch(err => {
              res.status(403).json({
                failed: 'impossible de mettre à jour'
              });
            })
          } else {
            res.status(403).json({
              failed: 'quote deja aimé'
            })
          }
        })
        .catch(err => {
          res.status(403).json({
            failed: 'quote'
          });
        })
    })
    .catch(err => {
      res.status(403).json({
        failed: 'user'

      });
    })
});

app.get('/deletelike/:userId/:quoteId', (req, res) => {
  // il faut tester ken fama user 3andou userId comme id
  // il faut tester zeda ken fama quote 3andou quoteId comme id
  // il faut tester ken el user 3amel jaime deja lel quote hadhika
  User.findOne({ _id: req.params.userId })
    .then(user => { // cbon l9it el user
      Quote.findById(req.params.quoteId)
        .then(quote => { // cbon l9it el quote
          var test = false;
          user.quotes.forEach(q => { // nparcouriw kol jomla hatina 3liha jaime w nchoufou ken el jomla eli nheou na7iwha mawjouda deja
            if (!test && JSON.stringify(q._id) === JSON.stringify(quote._id)) { // rahi mawjouda cbon (!test => test == false)
              test = true; // bch tokhrej
            }
          })
          if (test == true) {
            // jawna mrigl sahbi lghoul, nfaskhou el quote mel tableau
            user.quotes = user.quotes.filter(q => JSON.stringify(q._id) !== JSON.stringify(req.params.quoteId)); // filter tna7ilek el quote eli nhebou nfaskhouh
            user.save().then((result) => { // bch nsauvegardiw les changements fel base
              res.json({ success: true });
            }).catch(err => {
              res.status(403).json({
                failed: 'impossible de mettre à jour'
              });
            })
          } else {
            res.status(403).json({
              failed: 'quote deja non aimé'
            })
          }
        })
        .catch(err => {
          res.status(403).json({
            failed: 'quote'
          });
        })
    })
    .catch(err => {
      res.status(403).json({
        failed: 'user'
      });
    })
});

// /randomquote pour recevoir un proverbe par hasard
app.get('/randomquote', (req, res) => {
  Quote.countDocuments({}, (err, n) => {
    var r = Math.floor(Math.random() * n); // r tekhou la ligne eli bch nejbdouha bezhar
    Quote.find().limit(1).skip(r).exec((err, quote) => {
      if (quote.length == 0) {
        res.status(402).json({
          message: 'Aucun proverbe trouvé!'
        })
      } else {
        res.json(quote[0]) //thezlek kol chay fel jomla, dekhla fiha  el id
      }
    });
  });
});

// /addquote pour ajouter un proverbe
app.post('/addquote', async (req, res) => {
  const new_quote = req.body;
  console.log(req.body);
  if (new_quote?.name == null) {
    res.status(402).json({
      message: "Requete pas complète!"
    });
  } else {
    Quote.create({
      name: new_quote.name
    });
    res.status(200).json({
      message: "Proverbe ajouté!"
    })
  }
});

// lancer le serveur web express
app.listen(3000, () => {
  console.log('Le serveur est lancé en port 3000!');
})


// kifech bch normzou lel relation entre les phrases favoris mta3 un user

// 2 choix : 


// le premier choix: 
// nhotou fel objet mta3 chaque user les phrases qu'il aime
// e.g. (exampli gratia) == par exemple (en latin) 
// {
//   name: 'siwar',
//   password: 'mastaa',
//   favoris: [ // tableau fih les quotes eli houwa yhebhom
//     {

//     }
//     ..
//   ]
// }

// le deuxième choix:
// nhotou fel objet mta3 chaque quote (choix) les users qui aiment ce choix
// {
//   name: 'Hedhiya ma9oula machhoura',
//   creator 'sisi',
//   users : [
//     {
//       name: 'siwar'
//     }
//   ]
// }