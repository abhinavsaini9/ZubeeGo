var mongoose= require("mongoose");

var offerSchema= mongoose.Schema({
    text:{
        type:String
    },
    images:[
        {
          url: String,
          filename: String
        }
    ]


})

module.exports =mongoose.model("Offer",offerSchema);