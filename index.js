const express = require("express");
const app = express();
const mongoose = require('mongoose');
const passport = require('passport');
const cors = require('cors');
var cookieSession = require('cookie-session');
const bodyparser = require('body-parser')
const methodoverride = require("method-override")
const User = require("./models/user")
const Localstrategy = require("passport-local")
const flash = require("connect-flash");
const user = require("./models/user");
const Announcement = require("./models/announcement");
const announcement = require("./models/announcement");
const Restaurant = require("./models/restaurant");
// const { rawListeners } = require("./models/announcement");
const AppError = require("./AppError");
const Review = require("./models/review");
const Comment = require("./models/comment");
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// require('./passport-setup');


require('dotenv').config();

app.use(
    cors({
         origin: "http://localhost:3000", // allow to server to accept request from different origin
         methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
         credentials: true, // allow session cookie from browser to pass through
   })
);
app.use(bodyparser.urlencoded({extended: false}));

app.use(bodyparser.json());

app.use(cookieSession({
    name: 'cookie-session',
    keys: ['key1', 'key2']
}))

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

// app.use(function (req, res, next) {
//     res.locals.currentUser = req.user;
//     res.locals.error = req.flash("error");
//     res.locals.success = req.flash("success");
//     next();
// });

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


app.get("/logout", function (req, res) {
    req.logOut();
    console.log("U have been logged out!!");
    req.flash("success", "Logged you out!!")
    res.redirect("/landing");
});

//////////////google auth/////////////////////////////

// app.get('/failed',(req,res) => {res.send("You failed");});
// app.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// app.get('/google/callback',   passport.authenticate('google', { failureRedirect: '/landing' }),
//   function(req, res) {
//     // Successful authentication, redirect home.
//     res.send(req.user);
//     res.redirect('/');
// });


//////////////////////Announcement///////////////////////////////////////////////////////////////////////////////////////////////
app.get("/announcements",isLoggedIn,function(req,res){
     
    Announcement.find().exec(function (err, foundAnnouncement){
        if (err) {
            console.log("something went wrong");
            console.log(err);
        }
        else{
            // console.log(foundAnnouncement[0].announcedBy);
            res.render("announcement",{Announcements:foundAnnouncement})
        }
    })
    
    
});

app.get("/add_announcements",isLoggedIn,function(req,res){ 
    res.render("add_announcements")
 });

app.post("/announcements",isLoggedIn,function(req,res){
    //console.log(req.body)
    var address = req.body.address;
    var authors = {
        id: req.user.id ,
        username: req.user.username
        
    };
    console.log(authors);
    var newAnnouncement = new Announcement({ address : address, text: req.body.text,announcedBy: authors});
    Announcement.create(newAnnouncement,function(err,newAnnouncement){
        if (err) {
            console.log(err);
            console.log(newAnnouncement)    
        }
        else {
           newAnnouncement.save();
           console.log(newAnnouncement)
           res.redirect("/announcements");  
        }
    })

});

app.get("/announcements/:id/edit",checkAnnouncementOwnership,function(req,res){
    Announcement.findById(req.params.id, function (err, founddiscussion) {
        res.render("edit_announcement", { Announcement: founddiscussion });
    });
})
app.put("/announcements/:id", checkAnnouncementOwnership, async (req, res,next) => {
    
    await Announcement.findByIdAndUpdate(req.params.id, {text: req.body.text,address: req.body.address}, function (err,updatedAnnouncement) {
        if (err) {
            res.redirect("/annoucements");

        } else {
            // updatedAnnouncement.save();
            req.flash("success", "Successfully Updated");
            res.redirect("/announcements");
        }
    })
});

app.delete("/announcements/:id", checkAnnouncementOwnership, async(req, res,next) => {
    Announcement.findByIdAndRemove(req.params.id, function (err,) {
        if (err) {
            res.redirect("back");
        } else {
            User.findById(req.user._id).exec(function (err, currentUser) {
                if (err) {
                    console.log(err);
                    throw new AppError('User not found', 401);
                }
                else {
                    currentUser.announcedByMe.pull(req.params.id);
                    
                    currentUser.save();
                    
                    req.flash("success", "Successfully Deleted");
                    res.redirect("/announcements");
                }
            })

        }
    });
});

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_KEY,
    api_secret: process.env.CLOUD_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'Hotel',
        allowedFormats: ['jpeg','png','jpeg']
    }
})

const upload = multer({storage});
app.get("/add_restaurants",isLoggedIn,function(req,res){
    res.render("addHotel");
})

app.post("/restaurants",isLoggedIn,upload.array('imgRest'),function(req,res){
    var address = req.body.address;
    var author = {
        username: req.user.username,
        id: req.user.id
    };
    
    var text = req.body.text
    var newRestaurant = new Restaurant({ address : address, name: req.body.name,text:text,createdBy: author});
    newRestaurant.images = req.files.map(f =>({url: f.path,filename: f.filename}));
    Restaurant.create(newRestaurant,function(err,newRestaurant){
        if (err) {
            console.log(err);
            console.log(newRestaurant)
        }
        else {
            console.log(newRestaurant)
            newRestaurant.save();
            User.findById(req.user.id,function(err,currentUser){
                currentUser.restAddedByMe.push(newRestaurant);
                currentUser.save();
                res.redirect("/");
            })
            
            
        }
    })
});


app.get("/restaurants/:id", isLoggedIn, async (req, res, next) => {
        try{
        Restaurants.findById(req.params.id).populate("reviews").exec(async (err, foundRestaurant, next) => {
            if (err) {
                console.log(err);
                next(new AppError());
            }
            await User.findById(req.user._id).exec(function (err, currUser){
                if (err) {
                    console.log(err);
                }
                else res.render("restaurants_show");
            })

        })}
        catch(e){
            next(e);
        }
})

app.post("/restaurants/:id/image",isLoggedIn,upload.array('imgRestOther'),function(req,res){
    Restaurant.findById(req.params.id,function(err,foundRestaurant){
        if(err){
            console.log(err);
            next(new AppError());
        }
        else{
            const imgs = req.files.map(f =>({url: f.path,filename: f.filename}));
            foundRestaurant.images.push(...imgs);
            foundRestaurant.save();
            res.redirect("/restaurants/"+req.params.id);
        }
    })
})

app.post("/restaurants/:id",isLoggedIn,upload.array('imgReview'),async(req, res,next)=>{
    try{
      var text = req.body.text;
      var newReview = new Review({text:text});
      newReview.images = req.files.map(f =>({url: f.path,filename: f.filename}));
      await Review.create(newReview,function(err,newReview){
          if(err){
              console.log(err);
              next(new AppError());
          }
          else{
             Restaurant.findById(req.params.id).exec(function(err,foundRestaurant){
                if(err){
                    console.log(err);
              next(new AppError());
                }
                else{
                newReview.save();
                foundRestaurant.reviews.push(newReview);
                foundRestaurant.save();
                res.redirect("/restaurants/:"+req.params.id);}
            })
          }
      })
      
    }
    catch(e){
        next(e);
    }
})

app.get("/restaurants/:id/reviews/:review_id", isLoggedIn, async (req, res, next) => {
    try{
    Review.findById(req.params.review_id).populate("comments").exec(async (err, foundReview, next) => {
        if (err) {
            console.log(err);
            next(new AppError());
        }
        await User.findById(req.user._id).exec(function (err, currUser){
            if (err) {
                console.log(err);
            }
            else res.render("comment_show");
        })

    })}
    catch(e){
        next(e);
    }
})

app.post("/restaurants/:id/reviews/:review_id",isLoggedIn,async(req, res,next)=>{
    try{
      var text = req.body.text;
      var newComment = new Comment({text:text});
      
      await Comment.create(newComment,function(err,newComment){
          if(err){
              console.log(err);
              next(new AppError());
          }
          else{
            Review.findById(req.params.review_id).exec(function(err,foundReview){
                if(err){
                    console.log(err);
              next(new AppError());
                }
                else{
                newComment.save();
                foundReviews.comment.push(newComment);
                foundReviews.save();
                res.redirect("/restaurants/:"+req.params.id+"/reviews/"+req.params.review_id);}
            })
          }
      })
      
    }
    catch(e){
        next(e);
    }
})


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////










//////////////////////////////////////////////// middleware ////////////////////////////////////////////////////////////////////////////

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

function checkAnnouncementOwnership(req, res, next) {
    if (req.isAuthenticated()) {
        Announcement.findById(req.params.id, function (err, foundAnnouncement) {
            if (err) {
                req.flash("error", "not found");
                res.redirect("back");
            } else {
                
                if (foundAnnouncement.announcedBy.id.equals(req.user._id)) {
                    next();
                }
               
                else {
                    req.flash("error", "You dont have permission to do that");
                    res.redirect("back");
                }
            }
        });
    } else {
        res.redirect("back");
    }
}







//////////////////////////////////////// Error Handling /////////////////////////////////////////////////////////////
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