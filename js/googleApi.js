// Initialize map to Paris
function initMap() {
  // Constructor creates a new map - only center and zoom are required.
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 48.856614, lng: 2.352222},
    zoom: 13,
    mapTypeControl: false
  });
}
