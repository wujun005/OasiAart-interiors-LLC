# HourX Home Service

## Google Maps address search

Address management and checkout use Google Maps/Places when a browser key is
configured. Copy `.env.example` to the environment file used for deployment and
set `VITE_GOOGLE_MAPS_API_KEY`.

Enable **Maps JavaScript API**, **Places API (New)**, and **Geocoding API** for
the key, then restrict it to the site's HTTP referrers and those three APIs.
The Maps API displays the map, Places powers search suggestions, and Geocoding
turns map clicks or drags into form-ready addresses. Without a key, address
forms remain usable through current-location lookup and manual entry.
