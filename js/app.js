var map;
// Load the map.
function initMap() {
  // Constructor creates a new map - only center and zoom are required.
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 40.7413549, lng: -73.9980244},
    zoom: 13,
    mapTypeControl: false
  });
}

// These are the real estate listings that will be shown to the user.
var locations = [
  {title: 'Park Ave Penthouse', location: {lat: 40.7713024, lng: -73.9632393}},
  {title: 'Chelsea Loft', location: {lat: 40.7444883, lng: -73.9949465}},
  {title: 'Union Square Open Floor Plan', location: {lat: 40.7347062, lng: -73.9895759}},
  {title: 'East Village Hip Studio', location: {lat: 40.7281777, lng: -73.984377}},
  {title: 'TriBeCa Artsy Bachelor Pad', location: {lat: 40.7195264, lng: -74.0089934}},
  {title: 'Chinatown Homey Space', location: {lat: 40.7180628, lng: -73.9961237}}
];

function marker(location, largeInfowindow) {
  var position = location.location;
  var title = location.title;
  // Create a marker per location, and put into markers array.
   var marker = new google.maps.Marker({
    map: map,
    icon: defaultIcon,
    position: position,
    title: title,
    animation: google.maps.Animation.DROP
  });

  // Create an onclick event to open an infowindow at each marker.
  marker.addListener('click', function() {
    populateInfoWindow(this, largeInfowindow);
  });

  return marker;
}
// This function takes in a COLOR, and then creates a new marker
// icon of that color. The icon will be 21 px wide by 34 high, have an origin
// of 0, 0 and be anchored at 10, 34).
function makeMarkerIcon(markerColor) {
  var markerImage = new google.maps.MarkerImage(
    'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|'+ markerColor +
    '|40|_|%E2%80%A2',
    new google.maps.Size(21, 34),
    new google.maps.Point(0, 0),
    new google.maps.Point(10, 34),
    new google.maps.Size(21,34));
  return markerImage;
}
// Style the markers a bit. This will be our listing marker icon.
var defaultIcon;

var highlightedIcon;

// This function populates the infowindow when the marker is clicked. We'll only allow
// one infowindow which will open at the marker that is clicked, and populate based
// on that markers position.
function populateInfoWindow(marker, infowindow) {
  // Check to make sure the infowindow is not already opened on this marker.
  if (infowindow.marker != marker) {
    if(infowindow.marker != null) {
      infowindow.marker.setIcon(defaultIcon);
    }
    marker.setIcon(highlightedIcon);
    infowindow.marker = marker;
    infowindow.setContent('<div>' + marker.title + '</div>');
    infowindow.open(map, marker);
    // Make sure the marker property is cleared if the infowindow is closed.
    infowindow.addListener('closeclick', function() {
      if(infowindow.marker != null) {
        infowindow.marker.setIcon(defaultIcon);
      }
      infowindow.marker = null;
    });
  }
}


var ViewModel = function () {
    var self = this;
    self.markerList = [];
    self.favItems = ko.observableArray([]);
    self.largeInfowindow = new google.maps.InfoWindow();

    locations.forEach(function(location) {
        self.markerList.push(new marker(location, self.largeInfowindow));
        self.favItems.push(location.title);
    });
    self.filter = ko.observable('');

    self.filterItems = function() {
      var filterText = self.filter().toUpperCase();
      self.markerList.forEach(function(marker) {
        title = marker.title.toUpperCase();
        favItemIndex = self.favItems.indexOf(marker.title);
        if (title.indexOf(filterText) > -1) {
          marker.setMap(map);
          if(favItemIndex < 0) {
            self.favItems.push(marker.title);
          }
        } else {
          marker.setMap(null);
          if (favItemIndex > -1) {
            self.favItems.remove(marker.title);
          }
        }
      });
    };

    self.clickFavItem = function(favItemTitle) {
      for (var i = 0; i < self.markerList.length; i++) {
        if (favItemTitle == self.markerList[i].title)  {
          populateInfoWindow(self.markerList[i], self.largeInfowindow);
        }
      }
    };

}

function initApp() {
  initMap();
  // Style the markers a bit. This will be our listing marker icon.
  defaultIcon = makeMarkerIcon('0091ff');
  // Create a "highlighted location" marker color for when the user
  // mouses over the marker.
  highlightedIcon = makeMarkerIcon('FFFF24');
  var model = new ViewModel();
  ko.applyBindings(model);

}
