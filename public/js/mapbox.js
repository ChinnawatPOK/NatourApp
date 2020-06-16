/* eslint-disable */

export const displayMap = (locations) => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoiY2hpbm5hd2F0cG9rIiwiYSI6ImNrYmFlYm50NzA0bm4yc24zY2drb210dWUifQ.2lRCJhWF-eQuHrx6jXAeLg';

  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/chinnawatpok/ckbaepzqd0gk91ilgyvmtsv7l',
    scrollZoom: false,
    // Lat Long
    //   center: [-118.113491, 34.111745],
    //   zoom: 10,
    //   interactive: false,
  });
  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    // create marker
    const el = document.createElement('div');
    // marker have in CSS
    el.className = 'marker';

    // Add marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // Add popup
    new mapboxgl.Popup({
      offset: 30,
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day} : ${loc.description}<\p>`)
      .addTo(map);

    // Entend map bounds to include current location
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100,
    },
  });
};
