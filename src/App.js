import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from '!mapbox-gl'; // eslint-disable-line import/no-webpack-loader-syntax
import { states } from '/Users/macc/Desktop/dashboard/src/states.js';
import ReactSlider from 'react-slider';
import Select from 'react-select';

mapboxgl.accessToken = 'pk.eyJ1IjoibWFjYWVsYXMiLCJhIjoiY2x0bnR1Z2czMDF5ZTJsbnJkNjJ4MDJ3YyJ9.ysEE5ZR5pJyRafqDH1BA0A';

export default function App() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [lng, setLng] = useState(-70.9);
  const [lat, setLat] = useState(42.35);
  const [zoom, setZoom] = useState(7);
  const [selectedOption, setSelectedOption] = useState(null); // Move useState to the top level
  const [sliderValue, setSliderValue] = useState(50);

  console.log(states);

  useEffect(() => {
    fetch('/api/get_geo_data')
      .then((response) => console.log(response));

    if (map.current) return; // initialize map only once
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [lng, lat],
      zoom: zoom
    });

    map.current.on('mousemove', (e) => {
      setLng(map.current.getCenter().lng.toFixed(4));
      setLat(map.current.getCenter().lat.toFixed(4));
      setZoom(map.current.getZoom().toFixed(2));
    });

    let geoJsonForm = {'type':'FeatureCollection','features':[]};

    states.forEach(element => {
      console.log(element);
      let tempData = {
        'type':'Feature',
        'properties':{
          'name':element['name'],
          'area':element['CENSUSAREA']
        },
        'geometry':{
          'type':'Polygon',
          'coordinates':element['geometry']
        }
      };
      geoJsonForm['features'].push(tempData);
    });
    console.log(geoJsonForm);

    map.current.on('load', () => {
      
      map.current.addSource('states', {'type':'geojson','data':geoJsonForm});

      map.current.addLayer({
        'id':'states',
        'type':'fill',
        'source':'states',
        'layout': {},
        'paint': {
          'fill-color': 'blue',
          'fill-opacity': sliderValue/100 //play with this
        }
      });
      map.current.addLayer({
        'id':'outline',
        'type':'line',
        'source':'states',
        'layout':{},
        'paint': {
          'line-color':'red',
          'line-width': 3
        }
      });

      const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false
      });

      map.current.on('mouseenter', 'states', (e) => {
        console.log(e);
        // Change the cursor style as a UI indicator.
        map.current.getCanvas().style.cursor = 'pointer';

        // Copy coordinates array.
        const coordinates = e.features[0].geometry.coordinates.slice();
        const description = e.features[0].properties;

        let sName = description.name;
        let sArea = description.area;

        let htmlToAdd = 'The area of ' + sName + ' is ' + sArea;

        // Populate the popup and set its coordinates
        // based on the feature found.
        popup.setLngLat(coordinates[0][0]).setHTML(htmlToAdd).addTo(map.current);
      });

      map.current.on('mouseleave', 'states', () => {
        map.current.getCanvas().style.cursor = '';
        popup.remove();
      });
    });
  }, [lng, lat, zoom, sliderValue]);

  function handleChange(value) {
    setSelectedOption(value);
    if (value === 'off') {
      map.current.setLayoutProperty('states', 'visibility', 'none');
    } else{
      map.current.setLayoutProperty('states', 'visibility', 'visible');
    }
  } 
  const handleSliderChange = newValue => {
    setSliderValue(newValue);
    // Adjust the fill-opacity paint property of the layer based on the slider value
    map.current.setPaintProperty('states', 'fill-opacity', newValue / 100);
  };

  const options = [
    {value: 'on', label: 'On'},
    {value: 'off', label: 'Off'},
  ];

  return (
    <div>
      <div className="sidebar">
        Longitude: {lng} | Latitude: {lat} | Zoom: {zoom}
      </div>
      <div className="slider-container" >
        <ReactSlider 
          ariaLabelledby="slider-label"
          defaultValue={[50]}
          className="customSlider"
          onChange={handleSliderChange}         
          thumbClassName="customSlider-thumb"
          trackClassName="customSlider-track"
          renderThumb={(props, state) => <div {...props}>{state.valueNow}</div>} />
      </div>

      <div className = "select-container"> 
        <Select
          className="select"
          defaultValue={selectedOption}
          onChange={e => handleChange(e.value, setSelectedOption)}
          options={options} />

      </div>
          
      <div ref={mapContainer} className="map-container" />
    </div>
  );
}
