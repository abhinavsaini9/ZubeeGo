var mongoose= require("mongoose");

var reviewSchema= mongoose.Schema({
    text:{
       type: String
       
    },
    noOfLikes:{
        type: Number,
        default: 0

    },

    time1:{
        type:String,
        default:new Date().toISOString().slice(0,10)
    },
    author:{
        id:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User"
        },
        username:String
    
    },
    images:[
        {
          url: String,
          filename: String
        }
      ],
    likedby:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],
    comments:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment"
        }
    ]

});

module.exports =mongoose.model("Review",reviewSchema);