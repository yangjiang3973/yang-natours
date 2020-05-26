export const displayMap = (locations) => {
    mapboxgl.accessToken =
        'pk.eyJ1IjoieWFuZzM5NzMiLCJhIjoiY2thZjg4eWVrMHF3dDJwbWIwbnJvd3VncSJ9.OC3YYWZS03r2xzEhq5XRcA';

    var map = new mapboxgl.Map({
        container: 'map', // elem id
        style: 'mapbox://styles/yang3973/ckaf8ci9k24s81ipuahwjlpet',
        scrollZoom: false,
        // center: [-118.113491, 34.111745],
        // zoom: 10,
        // interactive: false,
    });

    const bounds = new mapboxgl.LngLatBounds();

    locations.forEach((loc) => {
        // Create a marker
        const el = document.createElement('div');
        el.className = 'marker';

        // Add marker
        new mapboxgl.Marker({
            element: el,
            anchor: 'bottom',
        })
            .setLngLat(loc.coordinates)
            .addTo(map);

        // Add pop
        new mapboxgl.Popup({
            offset: 30,
        })
            .setLngLat(loc.coordinates)
            .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
            .addTo(map);

        // extend bound to include current location
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
