const express = require("express");
const app = express();
const mongoose = require('mongoose');
const passport = require('passport');
const bodyparser = require('body-parser')
const methodoverride = require("method-override")
const User = require("./models/user")
const Localstrategy = require("passport-local")
const flash = require("connect-flash");
const user = require("./models/user");
const Announcement = require("./models/announcement");


require('dotenv').config();

mongoose
 .connect(process.env.DB_URL,{
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
}).then(() => console.log('DB Connected'));

app.set("view engine", "ejs");
app.use(bodyparser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodoverride("_method"));


app.use(require("express-session")({
    secret: "ZubeeGoSemesterProject",
    cookie: { 
        httpOnly: true,
        expires : Date.now() + 3600000*24*7,
        maxAge: 3600000*24*7
    },
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new Localstrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.use(flash());

app.use(function (req, res, next) {
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

app.use(flash());

app.use(function (req, res, next) {
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

//////////////////login and signup routes/////////////////////////////////

app.get("/",isLoggedIn,function (req,res){
   console.log("bc");
   res.render("home");
});

app.get("/landing", function (req, res) {
    console.log("Landing Page");
    res.render("landing");
});

app.get("/register", function (req, res) {
    console.log("Register page");
    res.render("register");

});

app.post("/register", function (req, res) {
    var newUser = new User({ username: req.body.username, email: req.body.email});

    User.register(newUser, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            req.flash("error", err.message);
            return res.render("register");
        }
        passport.authenticate("local")(req, res, function () {
            req.flash("success", "Welcome to Our Website " + user.username);
            console.log(user);
            res.redirect("/");
        });
    });
});

app.get("/login", function (req, res) {
    console.log("Login page");
    res.render("login");

});

app.post("/login", passport.authenticate("local", {
    failureFlash: true,
    failureRedirect: "/landing"
}), function (req, res) {
    console.log("kd");
    req.flash('success', 'welcome back');
    const redirectUrl = req.session.returnTo || '/';
    delete req.session.returnTo;
    res.redirect(redirectUrl);

});





app.get("/announcements",isLoggedIn,function(req,res){
     
    Announcement.find().exec(function (err, foundAnnouncement){
        if (err) {
            console.log("something went wrong");
            console.log(err);
        }
        else{

            res.render("/announcements/show",{Announcement:foundAnnouncement})
        }
    })
    
    
});

app.post("/announcements",isLoggedIn,function(req,res){
    var author = {
        username: req.user.username,
        id: req.user._id
    };
    var newAnnouncement = new User({ text: req.body.text,announcedBy: author});
    Announcement.create(newAnnouncement,function(err,newAnnouncement){
        if (err) {
            console.log(err);
            console.log(newdiscussion)
            
        }
        else {
           newAnnouncement.save();
           res.redirect("/announcements");  
        }

    })

});







app.get("/logout", function (req, res) {
    req.logOut();
    req.flash("success", "Logged you out!!")
    res.redirect("/landing");
});













function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
        //console.log(User);
    }
    //console.log();
    req.session.returnTo = req.originalUrl;
    req.flash('error', "You need to be logged in to do that");
    res.redirect("/landing");
};

app.all('*', (req, res, next) => {
    
    next(new AppError('Page Not Found', 404));
})

app.use((err, req, res, next) => {
    const { status = 500, message = 'Something Went Wrong' } = err;
    res.status(status).send(message);
})








const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`ZubeeGo Backend Server is running on ${port}`)
});