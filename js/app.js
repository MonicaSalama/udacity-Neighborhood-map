var map;
// Load the map.
// These are the favourite location listings that will be shown to the user.
var locations = [
  {title: 'Champs-Élysées', location: {lat: 48.865784, lng: 2.307314}},
  {title: 'Tour Eiffel', location: {lat: 48.85837, lng: 2.294481}},
  {title: 'Cathédrale Notre-Dame de Paris', location: {lat: 48.852968, lng: 2.349903}},
  {title: 'Sacré-Coeur', location: {lat:48.886706, lng: 2.343023}},
  {title: 'Chateau de Vincennes ', location: {lat: 48.842565, lng: 2.434529}},
  {title: 'Quartier latin', location: {lat: 48.851378, lng: 2.343215}}
];
// default icon for the marker
var defaultIcon;
// highlighted icon for marker used when user clicks on a marker
// or clicks an item from the listing
var highlightedIcon;

// Initialize map to Paris
function initMap() {
  // Constructor creates a new map - only center and zoom are required.
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 48.856614, lng: 2.352222},
    zoom: 13,
    mapTypeControl: false
  });
}

// A helper function to great a marker for a specific location
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
    getWiki(marker.title, infowindow);
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

function getWiki(favItemTitle, infoWindow) {
  console.log(favItemTitle);
  var wikiurl = 'https://en.wikipedia.org/w/api.php?'
      +'action=opensearch&search=' + favItemTitle
      + '&format=json&formatversion=2&redirect=&callback=wikiCallback';

    var wikiRequestTimeout = setTimeout(function() {
      if (infoWindow != null) {
        var innerHtml = infoWindow.content;
        innerHtml = innerHtml + '\n'
            + '<div class="wiki-elem">failed to get wikipedia resources</div>';
        infoWindow.setContent(innerHtml);
      }
    }, 8000);

    $.ajax({
      url: wikiurl,
      dataType: "jsonp",
      success: function(response) {
        if (infoWindow == null) {
          return;
        }
        console.log(response);
        var innerHtml = infoWindow.content;
        innerHtml += '<div><ul id="wikipedia-links">';
        var articleList = response[1];
        for (var i = 0; i < articleList.length; i++) {
          articleStr = articleList[i];
          var url = 'http://en.wikipedia.org/wiki/' + articleStr;
          innerHtml += ('<li><a href="' + url +'">'
              + articleStr + '</a></li>');
        };
        if (articleList.length == 0) {
          innerHtml += "No Wikipedia articles found";
        }
        innerHtml += '</ul></div>';
        infoWindow.setContent(innerHtml);
        clearTimeout(wikiRequestTimeout)
      }
    });
}


var ViewModel = function () {
    var self = this;
    self.markerList = [];
    self.favItems = ko.observableArray([]);
    self.largeInfowindow = new google.maps.InfoWindow();
    var bounds = new google.maps.LatLngBounds();
    locations.forEach(function(location) {
        self.markerList.push(new marker(location, self.largeInfowindow));
        bounds.extend(location.location);
        self.favItems.push(location.title);
    });
    map.fitBounds(bounds);
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
