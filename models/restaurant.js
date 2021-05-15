const mongoose = require('mongoose');
const geocoder = require('../utils/geocoder');

const RestaurantSchema = new mongoose.Schema({
  name:{
        type: String,
        required:[true,'Please add a name']
  },
  address: {
    type: String,
    required: [true, 'Please add an address']
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
    images:[
      {
        url: String,
        filename: String
      }
    ],
  createdAt: {
    type: Date,
    default: Date.now
  },
  text:{
    type: String
  },
  createdBy:{
    id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    username: String
    
},
reviews:[
  {
    type:mongoose.Schema.Types.ObjectId,
    ref:"Review"
  }
],
offers:[
  {
    type:mongoose.Schema.Types.ObjectId,
    ref:"Offer"
  }
]

});

// Geocode & create location
RestaurantSchema.pre('save', async function(next) {
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

module.exports = mongoose.model('Restaurant', RestaurantSchema);