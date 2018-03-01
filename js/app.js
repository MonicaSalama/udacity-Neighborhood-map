// Represents the app viewModel.
var model;
// If same marker clicked more than once, if error has occured reload else do nothing
var errorWiki = false;
var errorStreetView = false;

// The map is loaded only once and kept in the map variable.
var map;
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

// Load the map.
// Initialize map to Paris
function initMap() {
  // Constructor creates a new map - only center and zoom are required.
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 48.856614, lng: 2.352222},
    zoom: 13,
    mapTypeControl: false
  });
}

// A helper function to create a marker for a specific location
function marker(location, largeInfowindow) {
  var position = location.location;
  var title = location.title;
   var marker = new google.maps.Marker({
    map: map,
    icon: defaultIcon,
    position: position,
    title: title,
    animation: google.maps.Animation.DROP
  });
  // Create an onclick event to open an infowindow at each marker.
  marker.addListener('click', function() {
    // Populates info window and show wiki articles related to this marker
    showListingDetails(marker, largeInfowindow);
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

// Populates info window and show wiki articles related to a marker.
// this function is executed when a marker or an item from the listing is clicked
function showListingDetails(marker, infowindow) {
  // Check to make sure the infowindow is not already opened on this marker
  if (infowindow.marker != marker) {
    populateInfoWindow(marker, infowindow);
    getWiki(marker.title, infowindow);
    return;
  }
  // same marker previously cicked but an error has occured.
  if (errorStreetView) {
    populateInfoWindow(marker, infowindow);
  }
  if (errorWiki) {
    getWiki(marker.title, infowindow);
  }
}

// This function populates the infowindow when the marker is clicked. We'll only allow
// one infowindow which will open at the marker that is clicked, and populate based
// on that markers position.
function populateInfoWindow(marker, infowindow) {
  if(infowindow.marker && infowindow.marker !== null) {
    // When user clicks another marker without closing infoWindow of another
    // previously clicked
    // then clear the previous marker wiki links + set its icon to default
    clearWikipediaLinks();
    infowindow.marker.setIcon(defaultIcon);
  }
  // set the marker icon to highlighted
  marker.setIcon(highlightedIcon);
  infowindow.marker = marker;
  infowindow.setContent('<div>' + marker.title + '</div>' + '<div id="pano"></div>');
  // Make sure the marker property is cleared if the infowindow is closed.
  infowindow.addListener('closeclick', function() {
    if(infowindow.marker && infowindow.marker !== null) {
      clearWikipediaLinks();
      infowindow.marker.setIcon(defaultIcon);
    }
    infowindow.marker = null;
  });

  // show street view of the marker location in the infoWindow
  showStreetView(marker, infowindow);
  // Open the infowindow on the correct marker.
  infowindow.open(map, marker);
}

// This function retrieves articles related to specific location * marker location*
function getWiki(favItemTitle, infoWindow) {
  var wikiurl = 'https://en.wikipedia.org/w/api.php?action=opensearch&search=' + favItemTitle + '&format=json&formatversion=2&redirect=&callback=wikiCallback';

    var $wikiElem = $('#wikipedia-links');

    // if request fails show a message to the user in the wikipedia section.
    var wikiRequestTimeout = setTimeout(function() {
      errorWiki = true;
      $wikiElem.text("   Failed to get wikipedia resources   ");
    }, 4000);

    $.ajax({
      url: wikiurl,
      dataType: "jsonp",
      success: function(response) {
        var articleList = response[1];
        for (var i = 0; i < articleList.length; i++) {
          articleStr = articleList[i];
          var url = 'http://en.wikipedia.org/wiki/' + articleStr;
          model.wikiLinksList.push({url: url, title: articleStr});
        }
        if (articleList.length === 0) {
          $wikiElem.text("No wikipedia articles found.");
        }
        // The request succeded timeout must be cleared.
        errorWiki = false;
        clearTimeout(wikiRequestTimeout);
      }
    });
}

// clear all data related to a previously clicked marker.
function clearWikipediaLinks() {
  // This is important, if a previous request has failes or found
  // no articles the wiki element will have some indicatif text in it
  // and must be cleared.
  $('#wikipedia-links').text('');
  // remove all previous links related to another previously
  // clicked marker
  model.wikiLinksList.removeAll();
}

// Retrieves and shows streetView of a location in infoWindow.
function showStreetView(marker, infowindow) {
  var streetViewService = new google.maps.StreetViewService();
  var radius = 50;
  // In case the status is OK, which means the pano was found, compute the
  // position of the streetview image, then calculate the heading, then get a
  // panorama from that and set the options
  function getStreetView(data, status) {
    if (status == google.maps.StreetViewStatus.OK) {
      errorStreetView = false;
      var nearStreetViewLocation = data.location.latLng;
      var heading = google.maps.geometry.spherical.computeHeading(
        nearStreetViewLocation, marker.position);
        var panoramaOptions = {
          position: nearStreetViewLocation,
          pov: {
            heading: heading,
            pitch: 30
          }
        };
      var panorama = new google.maps.StreetViewPanorama(
        document.getElementById('pano'), panoramaOptions);
    } else {
      errorStreetView = true;
      $('#pano').text('No Street View Found');
    }
  }
  // Use streetview service to get the closest streetview image within
  // 50 meters of the markers position
  streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);
}

// Application viewModel
var ViewModel = function () {
    var self = this;
    // A list that will hold markers for our favorite locations.
    self.markerList = [];
    // A list of listings of titles of our favorite locations.
    // must be kept in sync with markerList.
    self.favItems = ko.observableArray([]);
    // A list of wikiLinks that get filled when a location is chosen
    // from the listing or by clicking on a marker.
    self.wikiLinksList = ko.observableArray([]);
    // Window shows info about a particular location.
    self.largeInfowindow = new google.maps.InfoWindow();
    // Used to set the bounds of the map to fit all our favorite locations Markers.
    var bounds = new google.maps.LatLngBounds();
    // For each location create a marker and add it to favItems list.
    locations.forEach(function(location) {
        self.markerList.push(new marker(location, self.largeInfowindow));
        // extend bounds to include all markers.
        bounds.extend(location.location);
        self.favItems.push(location.title);
    });
    // fit map to include all markers.
    map.fitBounds(bounds);
    // Used to filter location, its value is provided by the user.
    self.filter = ko.observable('');

    // Used to filter markers and favItems list by location name.
    // filtering is case insensetive.
    self.filterItems = function() {
      // filter provided by the user.
      var filterText = self.filter().toUpperCase();

      self.markerList.forEach(function(marker) {

        title = marker.title.toUpperCase();
        // get marker corresponding item in favorite items list.
        favItemIndex = self.favItems.indexOf(marker.title);
        if (title.indexOf(filterText) > -1) {
          // Item should be included
          marker.setMap(map);
          // If it's not in the favItems list add it.
          if(favItemIndex < 0) {
            self.favItems.push(marker.title);
          }
        } else {
          // Item should be exclueded
          marker.setMap(null);
          // If  it's in the favItem list remove it.
          if (favItemIndex > -1) {
            self.favItems.remove(marker.title);
          }
        }
      });
    };

    // When an item from the listing is clicked, find its corresponding
    // marker and show info related to that marker.
    self.clickFavItem = function(favItemTitle) {
      for (var i = 0; i < self.markerList.length; i++) {
        if (favItemTitle == self.markerList[i].title)  {
          showListingDetails(self.markerList[i], self.largeInfowindow);
        }
      }
    };
};

// Initialize App
function initApp() {
  // Init map
  initMap();
  // default marker icon.
  defaultIcon = makeMarkerIcon('0091ff');
  // Create a "highlighted location" marker color for when the user
  // mouses over the marker.
  highlightedIcon = makeMarkerIcon('FFFF24');
  model = new ViewModel();
  ko.applyBindings(model);
}
