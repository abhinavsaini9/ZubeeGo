var home = {Latitude:"", Longitude:""};


console.log("Hello");
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
mapboxgl.accessToken = 'pk.eyJ1IjoiN2gzYjAwZzN5bTRuIiwiYSI6ImNrb2c0NzVmYzBrOXYybnAxdnQ5d3Uxa3EifQ.00VSg0PcKIu41lStKIiiQQ';
sleep(3000).then(() => { 
const map = new mapboxgl.Map({
container: 'map',
style: 'mapbox://styles/mapbox/streets-v11',
zoom: 5,
center: [home.Longitude, home.Latitude]
});

var Current = new mapboxgl.Marker()
.setLngLat([home.Longitude, home.Latitude])
.addTo(map);

console.log("ehe");
console,log(Restaurants);
Restaurants.forEach(resta => {
    console.log(resta.location.coordinates);
    var Current = new mapboxgl.Marker()
     .setLngLat([resta.location.coordinates])
     .addTo(map);
 });

});

