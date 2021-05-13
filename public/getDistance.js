var home = {Latitude:"", Longitude:""};


console.log("Hello Annoucement");
function showPosition(position) {
    home.Latitude = position.coords.latitude;
    home.Longitude = position.coords.longitude;
    console.log(home.Latitude)
    console.log(home.Longitude)
}

if (navigator.geolocation) {
    console.log("Permission")
    navigator.geolocation.getCurrentPosition(showPosition);
}
else{
    console.log("No permission");
}
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


//center {longitude, latitude}
function getDistanceFromLatLonInKm( lat2, lon2) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2-home.latitude);  // deg2rad below
    var dLon = deg2rad(lon2-home.longitude); 
    var a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(home.latitude)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
      ; 
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    var d = R * c; // Distance in km
    return Math.abs(d);
  }

  function deg2rad(deg) {
    return deg * (Math.PI/180)
  }