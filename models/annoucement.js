var mongoose= require("mongoose");

var announcementSchema = mongoose.Schema({
    text:{
        type: String,
        required: true
    },
    noOfVerification:{
         type: Number,
         default: 0
 
    },
    noOfReports:{
        type: Number,
        default: 0
    },
    annoucementTime:{
         type:String,
         default:new Date().toISOString().slice(0,10)
    },
    announcedBy:{
         id:{
             type:mongoose.Schema.Types.ObjectId,
             ref:"User"
         },
         username:String
         
    },
    verifiedBy:[
         {
             type: mongoose.Schema.Types.ObjectId,
             ref: "User"
         }
    ],
    reportedBy:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ]
});


module.exports =mongoose.model("Announcement",announcementSchema);