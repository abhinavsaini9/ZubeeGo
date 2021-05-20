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

Dest.forEach(desti => {
    console.log(desti);
    console.log(desti.location.coordinates);
    let he = "/dests/"+desti._id;
    console.log(he);
    var el_4 = document.createElement('div');
    el_4.id = 'dest';
    var Current1 = new mapboxgl.Marker(el_4)
     .setLngLat(desti.location.coordinates)
     .setPopup(
        new mapboxgl.Popup({
            offset : 25
        })
        .setHTML(
            `<h3>${desti.name}</h3><p>${desti.text}</p><a href=${he}>Go to page</a>`
        )
    )
     .addTo(map);
 });
});
