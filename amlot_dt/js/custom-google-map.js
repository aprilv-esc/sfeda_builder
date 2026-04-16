jQuery(document).on('ready', function($){
	//set your google maps parameters
	var $latitude = 9.9360244,
		$longitude = 77.9149016,
		$map_zoom = 15;

	//google map custom marker icon - .png fallback for IE11
	var is_internetExplorer11= navigator.userAgent.toLowerCase().indexOf('trident') > -1;
	var $marker_url = 'http://i.imgur.com/wG8rFoc.png';
		
	//define the basic color of your map, plus a value for saturation and brightness
	var	$main_color = '#1d4a55',
		$saturation= -10,
		$brightness= 2;

	//we define here the style of the map
	var style= [ 
		{
			//set saturation for the labels on the map
			elementType: "labels",
			stylers: [
				{saturation: $saturation}
			]
		},  
	    {	//poi stands for point of interest - don't show these lables on the map 
			featureType: "poi",
			elementType: "labels",
			stylers: [
				{visibility: "off"}
			]
		},
		{
			//don't show highways lables on the map
	        featureType: 'road.highway',
	        elementType: 'labels',
	        stylers: [
	            {visibility: "off"}
	        ]
	    }, 
		{ 	
			//don't show local road lables on the map
			featureType: "road.local", 
			elementType: "labels.icon", 
			stylers: [
				{visibility: "on"} 
			] 
		},
		{ 
			//don't show arterial road lables on the map
			featureType: "road.arterial", 
			elementType: "labels.icon", 
			stylers: [
				{visibility: "off"}
			] 
		},
		{
			//don't show road lables on the map
			featureType: "road",
			elementType: "geometry.stroke",
			stylers: [
				{visibility: "off"}
			]
		}, 
		//style different elements on the map
		{ 
			featureType: "transit", 
			elementType: "geometry.fill", 
			stylers: [
				{ hue: $main_color },
				{ visibility: "on" }, 
				{ lightness: $brightness }, 
				{ saturation: $saturation }
			]
		}, 
		{
			featureType: "poi",
			elementType: "geometry.fill",
			stylers: [
				{ hue: $main_color },
				{ visibility: "on" }, 
				{ lightness: $brightness }, 
				{ saturation: $saturation }
			]
		},
		{
			featureType: "poi.government",
			elementType: "geometry.fill",
			stylers: [
				{ hue: $main_color },
				{ visibility: "on" }, 
				{ lightness: $brightness }, 
				{ saturation: $saturation }
			]
		},
		{
			featureType: "poi.sport_complex",
			elementType: "geometry.fill",
			stylers: [
				{ hue: $main_color },
				{ visibility: "on" }, 
				{ lightness: $brightness }, 
				{ saturation: $saturation }
			]
		},
		{
			featureType: "poi.attraction",
			elementType: "geometry.fill",
			stylers: [
				{ hue: $main_color },
				{ visibility: "on" }, 
				{ lightness: $brightness }, 
				{ saturation: $saturation }
			]
		},
		{
			featureType: "poi.business",
			elementType: "geometry.fill",
			stylers: [
				{ hue: $main_color },
				{ visibility: "on" }, 
				{ lightness: $brightness }, 
				{ saturation: $saturation }
			]
		},
		{
			featureType: "transit",
			elementType: "geometry.fill",
			stylers: [
				{ hue: $main_color },
				{ visibility: "on" }, 
				{ lightness: $brightness }, 
				{ saturation: $saturation }
			]
		},
		{
			featureType: "transit.station",
			elementType: "geometry.fill",
			stylers: [
				{ hue: $main_color },
				{ visibility: "on" }, 
				{ lightness: $brightness }, 
				{ saturation: $saturation }
			]
		},
		{
			featureType: "landscape",
			stylers: [
				{ hue: $main_color },
				{ visibility: "on" }, 
				{ lightness: $brightness }, 
				{ saturation: $saturation }
			]
			
		},
		{
			featureType: "road",
			elementType: "geometry.fill",
			stylers: [
				{ hue: $main_color },
				{ visibility: "on" }, 
				{ lightness: $brightness }, 
				{ saturation: $saturation }
			]
		},
		{
			featureType: "road.highway",
			elementType: "geometry.fill",
			stylers: [
				{ hue: $main_color },
				{ visibility: "on" }, 
				{ lightness: $brightness }, 
				{ saturation: $saturation }
			]
		}, 
		{
			featureType: "water",
			elementType: "geometry",
			stylers: [
				{ hue: $main_color },
				{ visibility: "on" }, 
				{ lightness: $brightness }, 
				{ saturation: $saturation }
			]
		}
	];
		
	//set google map options
	var map_options = {
      	center: new google.maps.LatLng($latitude, $longitude),
      	zoom: $map_zoom,
      	panControl: true,
      	zoomControl: true,
      	mapTypeControl: false,
      	streetViewControl: false,
      	mapTypeId: google.maps.MapTypeId.ROADMAP,
      	scrollwheel: false,
      	styles: style,
    }
    //inizialize the map
	var map = new google.maps.Map(document.getElementById('map-container'), map_options);
	//add a custom marker to the map				
	var marker = new google.maps.Marker({
	  	position: new google.maps.LatLng($latitude, $longitude),
	    map: map,
	    visible: true,
	 	icon: $marker_url,
	});

 
});

  