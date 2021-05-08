var mongoose= require("mongoose");
var geocoder = require("./../utils/geocoder")
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
    announcementTime:{
         type:String,
         default:new Date().toISOString().slice(0,10)
    },
    announcedBy:{
         id:{
             type:mongoose.Schema.Types.ObjectId,
             ref:"User"
         },
         username: String
         
    },
    address: {
        type: String
        },
    location: {
        type: {
          type: String,
          enum: ['Point']
        },
    coordinates: {
          type: [Number],
          index: '2dsphere'
        },
        formattedAddress: String
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

announcementSchema.pre('save', async function(next) {
    const loc = await geocoder.geocode(this.address);
    this.location = {
      type: 'Point',
      coordinates: [loc[0].longitude, loc[0].latitude],
      formattedAddress: loc[0].formattedAddress
    };
  
    // Do not save address
    this.address = undefined;
    next();
  });


module.exports =mongoose.model("Announcement",announcementSchema);