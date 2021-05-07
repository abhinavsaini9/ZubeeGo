var mongoose=    require("mongoose");
var passportLocalMongoose=require("passport-local-mongoose");


var UserSchema = new mongoose.Schema({

    username:{
        type:String}
        
    // },
    // email:{
    //    type: String,
    // //    required: true
    // }
   

    
});

UserSchema.plugin(passportLocalMongoose);
module.exports =mongoose.model("User",UserSchema);