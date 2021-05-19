const passport = require('passport');
var GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('./models/user')
require('dotenv').config();

passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((user, done) => {
    done(null, user);
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/google/callback",
    passReqToCallback: true
  },
  function(req,accessToken, refreshToken, profile, done) {
    //console.log(accessToken);
    //console.log(req.user);
    //check if user already exists in our db
    User.findOne({ googleId: profile.id }).then((curruser)=>{
      if(curruser){
        //already registered
        console.log("user is:" +curruser);
      }else{
        //if not, create one
        new User ({
          username: profile.displayName,
          googleId : profile.id
        }).save().then((newUser)=>{
          console.log("New User created" + newUser);
          done(null,newUser);
        })
      }
    })
    return done(null,profile);   
  }
));