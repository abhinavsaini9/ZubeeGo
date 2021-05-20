var home = {Latitude:"", Longitude:""};


console.log("Hello");
function showPosition(position) {
    home.Latitude = position.coords.latitude;
    home.Longitude = position.coords.longitude;
    console.log(home.Latitude)
    console.log(home.Longitude)
}
function noLocation() {
    console.log("Could not find location");
  }

if (navigator.geolocation) {
    console.log("Permission")
    navigator.geolocation.getCurrentPosition(showPosition,noLocation,{enableHighAccuracy:true});
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
zoom: 15,
center: [home.Longitude, home.Latitude]
});

var el_1 = document.createElement('div');
el_1.id = 'User';

var Current = new mapboxgl.Marker(el_1)
.setLngLat([home.Longitude, home.Latitude])
.setPopup(
    new mapboxgl.Popup({
        offset : 25
    })
    .setHTML(
        `<h3>Current Location</h3>`
    )
)
.addTo(map);

Hotels.forEach(hotel => {
    console.log(hotel);
    console.log(hotel.location.coordinates);
    let he = "/hotels/"+hotel._id;
    console.log(he);
    var el_3 = document.createElement('div');
    el_3.id = 'hotel';
    var Current1 = new mapboxgl.Marker(el_3)
     .setLngLat(hotel.location.coordinates)
     .setPopup(
        new mapboxgl.Popup({
            offset : 25
        })
        .setHTML(
            `<h3>${hotel.name}</h3><p>${hotel.text}</p><a href=${he}>Go to page</a>`
        )
    )
     .addTo(map);
 });
});