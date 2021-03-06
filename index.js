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
const Hotel = require("./models/hotel");
const Destination = require("./models/destination");
// const { rawListeners } = require("./models/announcement");
const AppError = require("./AppError");
const Review = require("./models/review");
const Comment = require("./models/comment");
const Offer = require("./models/offer");
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

require('./passport-setup');


require('dotenv').config();

app.use(cors());
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
app.use("/public",express.static("public"));
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

//////////////////login and signup routes/////////////////////////////////

app.get("/",isLoggedIn,function (req,res){
   console.log("bc");
   Restaurant.find().exec(function (err, foundRestaurant){
    if (err) {
        console.log("something went wrong");
        console.log(err);
    }
    else{
        Hotel.find().exec(function (err, foundHotel){
            if(err){
                console.log("error");
            }
            else{
                Destination.find().exec(function (err, foundDestination){
                    if(err){
                        console.log("error");
                    }  
                    else{
                        res.render("home",{Restaurant:foundRestaurant, Hotel:foundHotel, Dest:foundDestination})
                    }
                })
            }
        })
        // console.log(foundRestaurant);
        
    }
    })
});

app.get("/landing", function (req, res) {
    console.log("Landing Page");
    res.render("landing");
});

// app.get("/register", function (req, res) {
//     console.log("Register page");
//     res.render("register");

// });



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

// app.get("/login", function (req, res) {
//     console.log("Login page");
//     res.render("login");

// });

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

//viewProfile
app.get("/viewprofile",isLoggedIn,function(req,res){
    console.log("hello");
    console.log(req.user._id);
    User.findById(req.user._id).populate("restAddedByMe").populate("hotelAddedByMe").populate("destAddedByMe").exec(async (err, foundUser, next) => {
        if(err){
            console.log(err);
        }
        else{
            console.log(foundUser);
            res.render("profile",{foundUser:foundUser});

        }
    })
})


app.get("/logout", function (req, res) {
    req.logOut();
    console.log("U have been logged out!!");
    req.flash("success", "Logged you out!!")
    res.redirect("/landing");
});

//////////////google auth/////////////////////////////

app.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
app.get('/google/callback', passport.authenticate('google'),(req,res)=>{
    console.log(req.user);
    res.redirect("/");
});



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
        id: req.user._id ,
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
    res.render("addRestaurant");
})

//offer
app.get("/restaurant/:id/offer",isLoggedIn,checkRestOwnership,function(req,res){
    res.render("addoffer",{foundId:req.params.id});
})

app.post("/restaurant/:id/offer",isLoggedIn,checkRestOwnership,upload.array('imgOffer'),function(req,res){
    Restaurant.findById(req.params.id,async (err,foundRestaurant,next)=>{
        var text = req.body.text;
        
        var newOffer = {text:text};
        Offer.create(newOffer,async(err,myoffer,next)=>{
            if(err){
                console.log(err);

            }
            else{
                myoffer.images = req.files.map(f =>({url: f.path,filename: f.filename}));
                const x = await myoffer.save();
                console.log(x);
                foundRestaurant.offers.push(myoffer);
                foundRestaurant.address = foundRestaurant.location.formattedAddress;
                const y = await foundRestaurant.save();
                console.log(y);
                res.redirect("/restaurants/"+req.params.id);
            }
        })
        
    })
})

app.delete("/restaurants/:id/offer/:offer_id", isLoggedIn,checkRestOwnership, async(req, res,next) => {
    Offer.findByIdAndRemove(req.params.offer_id, function (err,) {
        if (err) {
            res.redirect("back");
        } else {
            Restaurant.findById(req.params.id).exec(function (err, foundRest) {
                if (err) {
                    console.log(err);
                    throw new AppError('User not found', 401);
                }
                else {
                    foundRest.offers.pull(req.params.id);
                    foundRest.address = foundRest.location.formattedAddress;
                    foundRest.save();
                    
                    req.flash("success", "Successfully Deleted");
                    res.redirect("/restaurants/"+req.params.id);
                }
            })

        }
    });
});

app.get("/showrestaurants",isLoggedIn,function(req,res){
     
    Restaurant.find().exec(function (err, foundRestaurant){
        if (err) {
            console.log("something went wrong");
            console.log(err);
        }
        else{
            // console.log(foundRestaurant);
            res.render("restaurantMap",{Restaurant:foundRestaurant})
        }
    })
    
    
});


app.post("/restaurants",isLoggedIn,upload.array('imgRest'),function(req,res){
    var address = req.body.address;
    var author = {
        username: req.user.username,
        id: req.user._id
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
            User.findById(req.user._id,function(err,currentUser){
                currentUser.restAddedByMe.push(newRestaurant);
                currentUser.save();
                console.log(newRestaurant.id);
                res.redirect("/restaurants/"+ newRestaurant.id);
            })       
        }
    })
});


app.get("/restaurants/:id", isLoggedIn, async (req, res, next) => {
        try{
        await Restaurant.findById(req.params.id).populate("reviews").populate("offers").exec(async (err, foundRestaurant, next) => {
            if (err) {
                console.log(err);
                next(new AppError());
            }
            await User.findById(req.user._id).exec(function (err, currUser){
                if (err) {
                    console.log(err);
                }
                else res.render("restaurants_show",{foundRestaurant: foundRestaurant});
            })

        })}
        catch(e){
            next(e);
        }
})

app.post("/restaurants/:id/image",isLoggedIn,upload.array('imgRestOther'),function(req,res){
    
    Restaurant.findById(req.params.id,async (err,foundRestaurant,next)=>{
        if(err){
            console.log(err);
            next(new AppError());
        }
        else{
            console.log(req.files);
            const imgs = req.files.map(f =>({url: f.path,filename: f.filename}));
            // console.log(foundRestaurant);
            foundRestaurant.images.push(...imgs);
            console.log(imgs);
            foundRestaurant.address = foundRestaurant.location.formattedAddress;
            await foundRestaurant.save();
            // console.log(foundRestaurant);
            res.redirect("/restaurants/"+req.params.id);
        }
    })
})
app.post("/restaurants/:id/imageLap",isLoggedIn,upload.array('imgRestOther2'),function(req,res){
    
    Restaurant.findById(req.params.id,async (err,foundRestaurant,next)=>{
        if(err){
            console.log(err);
            next(new AppError());
        }
        else{
            console.log(req.files);
            const imgs = req.files.map(f =>({url: f.path,filename: f.filename}));
            // console.log(foundRestaurant);
            foundRestaurant.images.push(...imgs);
            console.log(imgs);
            foundRestaurant.address = foundRestaurant.location.formattedAddress;
            await foundRestaurant.save();
            // console.log(foundRestaurant);
            res.redirect("/restaurants/"+req.params.id);
        }
    })
})
app.post("/restaurants/:id/imagemob",isLoggedIn,upload.array('imgRestOther1'),function(req,res){
    
    Restaurant.findById(req.params.id,async (err,foundRestaurant,next)=>{
        if(err){
            console.log(err);
            next(new AppError());
        }
        else{
            console.log(req.files);
            const imgs = req.files.map(f =>({url: f.path,filename: f.filename}));
            // console.log(foundRestaurant);
            foundRestaurant.images.push(...imgs);
            console.log(imgs);
            foundRestaurant.address = foundRestaurant.location.formattedAddress;
            await foundRestaurant.save();
            // console.log(foundRestaurant);
            res.redirect("/restaurants/"+req.params.id);
        }
    })
})
app.post("/restaurants/:id",isLoggedIn,upload.array('imgReview'),async(req, res,next)=>{
    try{
        console.log("Number"+req.params.id)
        Restaurant.findById(req.params.id).exec(function(err,foundRestaurant){
            if(err){
                console.log(err);
                next(new AppError());
            }
            else{
                var text = req.body.text;
                var authors = {
                    id: req.user._id ,
                    username: req.user.username
                    
                };
                var newReview = {text:text,author:authors};
                
                Review.create(newReview,async(err,myreview,next)=>{
                    if(err){
                        console.log(err);
                        next(new AppError());
                    }
                    else{
                        myreview.images = req.files.map(f =>({url: f.path,filename: f.filename}));
                       console.log(myreview);
                console.log(foundRestaurant);
                 const isReviewsaved = await myreview.save();
                  console.log("c"+isReviewsaved);
                console.log(foundRestaurant.reviews);
                console.log("cjdnckndklnvm kdmvf vrv-------------------------------");
                foundRestaurant.reviews.push(myreview);
                console.log(foundRestaurant);
                foundRestaurant.address = foundRestaurant.location.formattedAddress;
                const issave = await foundRestaurant.save();
                console.log("d"+issave);
                console.log(foundRestaurant.reviews);
                res.redirect("/restaurants/"+req.params.id);}
                       
            })}
     
                
                
            })}
          
    catch(e){
        next(e);
    }
})

app.get("/restaurants/:id/reviews/:review_id", isLoggedIn, async (req, res, next) => {
    try{
     Restaurant.findById(req.params.id).populate("reviews").exec(function(err,foundRest){
    if(err){
        console.log(err);
    }
    else{
    Review.findById(req.params.review_id).populate("comments").exec(async (err, foundReview, next) => {
        if (err) {
            console.log(err);
            next(new AppError());
        }
        await User.findById(req.user._id).exec(function (err, currUser){
            if (err) {
                console.log(err);
            }
            else res.render("comments",{foundRestaurant:foundRest,foundReview:foundReview});
        })

    })}})}
    catch(e){
        next(e);
    }
})

app.post("/restaurants/:id/reviews/:review_id",isLoggedIn,async(req, res,next)=>{
    try{
      var text = req.body.text;
      
      var authors = {
        id: req.user._id ,
        username: req.user.username
        
    };
    var newComment = new Comment({text:text,author:authors});
      
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
                console.log(newComment);
                foundReview.comments.push(newComment);
                foundReview.save();
                res.redirect("/restaurants/"+req.params.id+"/reviews/"+req.params.review_id);}
            })
          }
      })
      
    }
    catch(e){
        next(e);
    }
})



///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


/////////////////////////////////////////////////////////////////////////Hotel////////////////////////////////////////////////////////////////////////
app.get("/add_hotel",isLoggedIn,function(req,res){
    res.render("addHotel");
})

//offer
app.get("/hotel/:id/offer",isLoggedIn,checkHotelOwnership,function(req,res){
    res.render("addofferHotel",{foundId:req.params.id});
})

app.post("/hotel/:id/offer",isLoggedIn,checkHotelOwnership,upload.array('imgOfferHotel'),function(req,res){
    Hotel.findById(req.params.id,async (err,foundHostel,next)=>{
        var text = req.body.text;
        
        var newOffer = {text:text};
        Offer.create(newOffer,async(err,myoffer,next)=>{
            if(err){
                console.log(err);

            }
            else{
                myoffer.images = req.files.map(f =>({url: f.path,filename: f.filename}));
                const x = await myoffer.save();
                console.log(x);
                foundHostel.offers.push(myoffer);
                foundHostel.address = foundHostel.location.formattedAddress;
                const y = await foundHostel.save();
                console.log(y);
                res.redirect("/hotels/"+req.params.id);
            }
        })
        
    })
})

app.delete("/hotels/:id/offer/:offer_id", isLoggedIn,checkHotelOwnership, async(req, res,next) => {
    Offer.findByIdAndRemove(req.params.offer_id, function (err,) {
        if (err) {
            res.redirect("back");
        } else {
            Hotel.findById(req.params.id).exec(function (err, foundHotel) {
                if (err) {
                    console.log(err);
                    throw new AppError('User not found', 401);
                }
                else {
                    foundHotel.offers.pull(req.params.id);
                    foundHotel.address = foundHotel.location.formattedAddress;
                    foundHotel.save();
                    
                    req.flash("success", "Successfully Deleted");
                    res.redirect("/hotels/"+req.params.id);
                }
            })

        }
    });
});

app.get("/showhotel",isLoggedIn,function(req,res){
     
    Hotel.find().exec(function (err, foundHotel){
        if (err) {
            console.log("something went wrong");
            console.log(err);
        }
        else{
            // console.log(foundRestaurant);
            res.render("hotelMap",{Hotel:foundHotel})
        }
    })
    
    
});


app.post("/hotels",isLoggedIn,upload.array('imgHotel'),function(req,res){
    var address = req.body.address;
    var author = {
        username: req.user.username,
        id: req.user._id
    };
    
    var text = req.body.text
    var newHotel = new Hotel({ address : address, name: req.body.name,text:text,createdBy: author});
    newHotel.images = req.files.map(f =>({url: f.path,filename: f.filename}));
    Hotel.create(newHotel,function(err,newHotel){
        if (err) {
            console.log(err);
            console.log(newHotel)
        }
        else {
            console.log(newHotel)
            newHotel.save();
            User.findById(req.user._id,function(err,currentUser){
                currentUser.hotelAddedByMe.push(newHotel);
                currentUser.save();
                console.log(newHotel.id);
                res.redirect("/hotels/"+ newHotel.id);
            })       
        }
    })
});


app.get("/hotels/:id", isLoggedIn, async (req, res, next) => {
        try{
        await Hotel.findById(req.params.id).populate("reviews").populate("offers").exec(async (err, foundHotel, next) => {
            if (err) {
                console.log(err);
                next(new AppError());
            }
            await User.findById(req.user._id).exec(function (err, currUser){
                if (err) {
                    console.log(err);
                }
                else res.render("hotels_show",{foundHotel: foundHotel});
            })

        })}
        catch(e){
            next(e);
        }
})

app.post("/hotels/:id/image",isLoggedIn,upload.array('imgHotelOther'),function(req,res){
    
    Hotel.findById(req.params.id,async (err,foundHotel,next)=>{
        if(err){
            console.log(err);
            next(new AppError());
        }
        else{
            console.log(req.files);
            const imgs = req.files.map(f =>({url: f.path,filename: f.filename}));
            // console.log(foundHotel);
            foundHotel.images.push(...imgs);
            console.log(imgs);
            foundHotel.address = foundHotel.location.formattedAddress;
            await foundHotel.save();
            // console.log(foundHotel);
            res.redirect("/hotels/"+req.params.id);
        }
    })
})
app.post("/hotels/:id/imageLap",isLoggedIn,upload.array('imgHotelOther2'),function(req,res){
    
    Hotel.findById(req.params.id,async (err,foundHotel,next)=>{
        if(err){
            console.log(err);
            next(new AppError());
        }
        else{
            console.log(req.files);
            const imgs = req.files.map(f =>({url: f.path,filename: f.filename}));
            // console.log(foundHotel);
            foundHotel.images.push(...imgs);
            console.log(imgs);
            foundHotel.address = foundHotel.location.formattedAddress;
            await foundHotel.save();
            // console.log(foundRestaurant);
            res.redirect("/hotels/"+req.params.id);
        }
    })
})
app.post("/hotels/:id/imagemob",isLoggedIn,upload.array('imgHotelOther1'),function(req,res){
    
    Hotel.findById(req.params.id,async (err,foundHotel,next)=>{
        if(err){
            console.log(err);
            next(new AppError());
        }
        else{
            console.log(req.files);
            const imgs = req.files.map(f =>({url: f.path,filename: f.filename}));
            // console.log(foundHotel);
            foundHotel.images.push(...imgs);
            console.log(imgs);
            foundHotel.address = foundHotel.location.formattedAddress;
            await foundHotel.save();
            // console.log(foundHotel);
            res.redirect("/hotels/"+req.params.id);
        }
    })
})
app.post("/hotels/:id",isLoggedIn,upload.array('imgReview'),async(req, res,next)=>{
    try{
        console.log("Number"+req.params.id)
        Hotel.findById(req.params.id).exec(function(err,foundHotel){
            if(err){
                console.log(err);
                next(new AppError());
            }
            else{
                var text = req.body.text;
                var authors = {
                    id: req.user._id ,
                    username: req.user.username
                    
                };
                var newReview = {text:text,author:authors};
                
                Review.create(newReview,async(err,myreview,next)=>{
                    if(err){
                        console.log(err);
                        next(new AppError());
                    }
                    else{
                        myreview.images = req.files.map(f =>({url: f.path,filename: f.filename}));
                       console.log(myreview);
                console.log(foundHotel);
                 const isReviewsaved = await myreview.save();
                  console.log("c"+isReviewsaved);
                console.log(foundHotel.reviews);
                console.log("cjdnckndklnvm kdmvf vrv-------------------------------");
                foundHotel.reviews.push(myreview);
                console.log(foundHotel);
                foundHotel.address = foundHotel.location.formattedAddress;
                const issave = await foundHotel.save();
                console.log("d"+issave);
                console.log(foundHotel.reviews);
                res.redirect("/hotels/"+req.params.id);}
                       
            })}
     
                
                
            })}
          
    catch(e){
        next(e);
    }
})

app.get("/hotels/:id/reviews/:review_id", isLoggedIn, async (req, res, next) => {
    try{
     Hotel.findById(req.params.id).populate("reviews").exec(function(err,foundHotel){
    if(err){
        console.log(err);
    }
    else{
    Review.findById(req.params.review_id).populate("comments").exec(async (err, foundReview, next) => {
        if (err) {
            console.log(err);
            next(new AppError());
        }
        await User.findById(req.user._id).exec(function (err, currUser){
            if (err) {
                console.log(err);
            }
            else res.render("commentsHotel",{foundHotel:foundHotel,foundReview:foundReview});
        })

    })}})}
    catch(e){
        next(e);
    }
})

app.post("/hotels/:id/reviews/:review_id",isLoggedIn,async(req, res,next)=>{
    try{
      var text = req.body.text;
      
      var authors = {
        id: req.user._id ,
        username: req.user.username
        
    };
    var newComment = new Comment({text:text,author:authors});
      
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
                console.log(newComment);
                foundReview.comments.push(newComment);
                foundReview.save();
                res.redirect("/hotels/"+req.params.id+"/reviews/"+req.params.review_id);}
            })
          }
      })
      
    }
    catch(e){
        next(e);
    }
})

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////Destinations///////////////////////////////////////////////////////////////////////////
app.get("/add_destination",isLoggedIn,function(req,res){
    res.render("addDestinations");
})

//offer
app.get("/dest/:id/offer",isLoggedIn,checkDestOwnership,function(req,res){
    res.render("addofferDest",{foundId:req.params.id});
})

app.post("/dest/:id/offer",isLoggedIn,checkDestOwnership,upload.array('imgOfferDest'),function(req,res){
    Destination.findById(req.params.id,async (err,foundDestination,next)=>{
        var text = req.body.text;
        
        var newOffer = {text:text};
        Offer.create(newOffer,async(err,myoffer,next)=>{
            if(err){
                console.log(err);

            }
            else{
                myoffer.images = req.files.map(f =>({url: f.path,filename: f.filename}));
                const x = await myoffer.save();
                console.log(x);
                foundDestination.offers.push(myoffer);
                foundDestination.address = foundDestination.location.formattedAddress;
                const y = await foundDestination.save();
                console.log(y);
                res.redirect("/dests/"+req.params.id);
            }
        })
        
    })
})

app.delete("/dests/:id/offer/:offer_id", isLoggedIn,checkDestOwnership, async(req, res,next) => {
    Offer.findByIdAndRemove(req.params.offer_id, function (err,) {
        if (err) {
            res.redirect("back");
        } else {
            Destination.findById(req.params.id).exec(function (err, foundDestination) {
                if (err) {
                    console.log(err);
                    throw new AppError('User not found', 401);
                }
                else {
                    foundDestination.offers.pull(req.params.id);
                    foundDestination.address = foundDestination.location.formattedAddress;
                    foundDestination.save();
                    
                    req.flash("success", "Successfully Deleted");
                    res.redirect("/dests/"+req.params.id);
                }
            })

        }
    });
});

app.get("/showdestination",isLoggedIn,function(req,res){
     
    Destination.find().exec(function (err, foundDestination){
        if (err) {
            console.log("something went wrong");
            console.log(err);
        }
        else{
            // console.log(foundRestaurant);
            res.render("destMap",{Dest:foundDestination})
        }
    })
    
    
});


app.post("/dests",isLoggedIn,upload.array('imgDest'),function(req,res){
    var address = req.body.address;
    var author = {
        username: req.user.username,
        id: req.user._id
    };
    
    var text = req.body.text
    var newDestination = new Hotel({ address : address, name: req.body.name,text:text,createdBy: author});
    newDestination.images = req.files.map(f =>({url: f.path,filename: f.filename}));
    Destination.create(newDestination,function(err,newDestination){
        if (err) {
            console.log(err);
            console.log(newDestination)
        }
        else {
            console.log(newDestination)
            newDestination.save();
            User.findById(req.user._id,function(err,currentUser){
                currentUser.destAddedByMe.push(newDestination);
                currentUser.save();
                console.log(newDestination.id);
                res.redirect("/dests/"+ newDestination.id);
            })       
        }
    })
});


app.get("/dests/:id", isLoggedIn, async (req, res, next) => {
        try{
        await Destination.findById(req.params.id).populate("reviews").populate("offers").exec(async (err, foundDestination, next) => {
            if (err) {
                console.log(err);
                next(new AppError());
            }
            await User.findById(req.user._id).exec(function (err, currUser){
                if (err) {
                    console.log(err);
                }
                else res.render("dests_show",{foundDest: foundDestination});
            })

        })}
        catch(e){
            next(e);
        }
})

app.post("/dests/:id/image",isLoggedIn,upload.array('imgDestOther'),function(req,res){
    
    Destination.findById(req.params.id,async (err,foundDestination,next)=>{
        if(err){
            console.log(err);
            next(new AppError());
        }
        else{
            console.log(req.files);
            const imgs = req.files.map(f =>({url: f.path,filename: f.filename}));
            // console.log(foundDestination);
            foundDestination.images.push(...imgs);
            console.log(imgs);
            foundDestination.address = foundDestination.location.formattedAddress;
            await foundDestination.save();
            // console.log(foundDestination);
            res.redirect("/dests/"+req.params.id);
        }
    })
})
app.post("/dests/:id/imageLap",isLoggedIn,upload.array('imgDestOther2'),function(req,res){
    
    Destination.findById(req.params.id,async (err,foundDestination,next)=>{
        if(err){
            console.log(err);
            next(new AppError());
        }
        else{
            console.log(req.files);
            const imgs = req.files.map(f =>({url: f.path,filename: f.filename}));
            // console.log(foundDestination);
            foundDestination.images.push(...imgs);
            console.log(imgs);
            foundDestination.address = foundDestination.location.formattedAddress;
            await foundDestination.save();
            // console.log(foundDestination);
            res.redirect("/dests/"+req.params.id);
        }
    })
})
app.post("/dests/:id/imagemob",isLoggedIn,upload.array('imgDestOther1'),function(req,res){
    
    Destination.findById(req.params.id,async (err,foundDestination,next)=>{
        if(err){
            console.log(err);
            next(new AppError());
        }
        else{
            console.log(req.files);
            const imgs = req.files.map(f =>({url: f.path,filename: f.filename}));
            // console.log(foundDestination);
            foundDestination.images.push(...imgs);
            console.log(imgs);
            foundDestination.address = foundDestination.location.formattedAddress;
            await foundDestination.save();
            // console.log(foundDestination);
            res.redirect("/dests/"+req.params.id);
        }
    })
})
app.post("/dests/:id",isLoggedIn,upload.array('imgReview'),async(req, res,next)=>{
    try{
        console.log("Number"+req.params.id)
        Destination.findById(req.params.id).exec(function(err,foundDestination){
            if(err){
                console.log(err);
                next(new AppError());
            }
            else{
                var text = req.body.text;
                var authors = {
                    id: req.user._id ,
                    username: req.user.username
                    
                };
                var newReview = {text:text,author:authors};
                
                Review.create(newReview,async(err,myreview,next)=>{
                    if(err){
                        console.log(err);
                        next(new AppError());
                    }
                    else{
                        myreview.images = req.files.map(f =>({url: f.path,filename: f.filename}));
                       console.log(myreview);
                console.log(foundDestination);
                 const isReviewsaved = await myreview.save();
                  console.log("c"+isReviewsaved);
                console.log(foundDestination.reviews);
                console.log("cjdnckndklnvm kdmvf vrv-------------------------------");
                foundDestination.reviews.push(myreview);
                console.log(foundDestination);
                foundDestination.address = foundDestination.location.formattedAddress;
                const issave = await foundDestination.save();
                console.log("d"+issave);
                console.log(foundDestination.reviews);
                res.redirect("/dests/"+req.params.id);}
                       
            })}
     
                
                
            })}
          
    catch(e){
        next(e);
    }
})

app.get("/dests/:id/reviews/:review_id", isLoggedIn, async (req, res, next) => {
    try{
        Destination.findById(req.params.id).populate("reviews").exec(function(err,foundDestination){
    if(err){
        console.log(err);
    }
    else{
    Review.findById(req.params.review_id).populate("comments").exec(async (err, foundReview, next) => {
        if (err) {
            console.log(err);
            next(new AppError());
        }
        await User.findById(req.user._id).exec(function (err, currUser){
            if (err) {
                console.log(err);
            }
            else res.render("commentsDest",{foundDest:foundDestination,foundReview:foundReview});
        })

    })}})}
    catch(e){
        next(e);
    }
})

app.post("/dests/:id/reviews/:review_id",isLoggedIn,async(req, res,next)=>{
    try{
      var text = req.body.text;
      
      var authors = {
        id: req.user._id ,
        username: req.user.username
        
    };
    var newComment = new Comment({text:text,author:authors});
      
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
                console.log(newComment);
                foundReview.comments.push(newComment);
                foundReview.save();
                res.redirect("/dests/"+req.params.id+"/reviews/"+req.params.review_id);}
            })
          }
      })
      
    }
    catch(e){
        next(e);
    }
})

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////





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

function checkRestOwnership(req, res, next) {
    if (req.isAuthenticated()) {
        Restaurant.findById(req.params.id, function (err, foundAnnouncement) {
            if (err) {
                req.flash("error", "not found");
                res.redirect("back");
            } else {
                
                if (foundAnnouncement.createdBy.id.equals(req.user._id)) {
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

function checkHotelOwnership(req, res, next) {
    if (req.isAuthenticated()) {
        Hotel.findById(req.params.id, function (err, foundAnnouncement) {
            if (err) {
                req.flash("error", "not found");
                res.redirect("back");
            } else {
                
                if (foundAnnouncement.createdBy.id.equals(req.user._id)) {
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

function checkDestOwnership(req, res, next) {
    if (req.isAuthenticated()) {
        Destination.findById(req.params.id, function (err, foundAnnouncement) {
            if (err) {
                req.flash("error", "not found");
                res.redirect("back");
            } else {
                
                if (foundAnnouncement.createdBy.id.equals(req.user._id)) {
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