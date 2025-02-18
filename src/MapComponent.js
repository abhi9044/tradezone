import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleMap, LoadScript, Polygon, Marker, InfoWindow } from '@react-google-maps/api';
import axios from 'axios';
import { Tooltip as ReactTooltip } from 'react-tooltip';

const API_GET_POLYGONS = 'http://127.0.0.1:5000/api/get_all_polygons';
const API_SAVE_POLYGON = 'http://127.0.0.1:5000/api/save_polygon';
const API_GENERATE_AUTO_POLYGON = 'http://127.0.0.1:5000/api/generate_auto_polygon';
const API_CHECK_LOCATION = 'http://127.0.0.1:5000/api/check_location';
const API_GET_DISTANCE_TIME = 'http://127.0.0.1:5000/api/get_distance_time';

const center = { lat: 19.24847, lng: 72.97809 };

const MapComponent = () => {
    const [polygons, setPolygons] = useState([]);
    const [currentPolygon, setCurrentPolygon] = useState([]);
    const [drawingMode, setDrawingMode] = useState(false);
    const [infoWindowPosition, setInfoWindowPosition] = useState(null);
    const [infoWindowContent, setInfoWindowContent] = useState('');

    const mapRef = useRef(null);

    useEffect(() => {
        const fetchPolygons = async () => {
            try {
                const res = await axios.get(API_GET_POLYGONS);
                setPolygons(res.data);
                console.log(res.data); // Log the fetched polygons
            } catch (err) {
                console.error(err);
            }
        };
        fetchPolygons();
    }, []);

    const handleMapClick = useCallback(async (event) => {
        if (drawingMode) {
            const newPoint = { lat: event.latLng.lat(), lng: event.latLng.lng() };
            setCurrentPolygon((prev) => [...prev, newPoint]);

            // Fetch distance and time from backend
            try {
                const res = await axios.post(API_GET_DISTANCE_TIME, {
                    start: center,
                    end: newPoint
                });
                setInfoWindowPosition(newPoint);
                setInfoWindowContent(`Distance: ${res.data.distance} km, Time: ${res.data.time} min`);
            } catch (err) {
                console.error(err);
            }
        }else{
            const newPoint = { lat: event.latLng.lat(), lng: event.latLng.lng() };
            try {
                const res = await axios.post(API_GET_DISTANCE_TIME, {
                    start: center,
                    end: newPoint
                });
                setInfoWindowPosition(newPoint);
                setInfoWindowContent(`Distance: ${res.data.distance} km, Time: ${res.data.time} min`);
            } catch (err) {
                console.error(err);
            }
        
        }
    
    }, [drawingMode]);

    const handleSavePolygon = async () => {
        if (currentPolygon.length > 2) {
            const polygonName = prompt("Enter a name for the polygon:");
            if (!polygonName) return;

            try {
                await axios.post(API_SAVE_POLYGON, {
                    name: polygonName,
                    points: currentPolygon
                });
                alert('Polygon saved successfully!');
                setPolygons((prev) => [...prev, { name: polygonName, points: currentPolygon }]);
                setCurrentPolygon([]);
                setDrawingMode(false);
            } catch (err) {
                console.error(err);
            }
        } else {
            alert("A polygon requires at least 3 points.");
        }
    };

    const handleGenerateAutoPolygon = async () => {
        try {
            const res = await axios.post(API_GENERATE_AUTO_POLYGON, {
                center: center
            });
            setCurrentPolygon(res.data.polygon);
        } catch (err) {
            console.error(err);
        }
    };

    const checkLocation = async () => {
        const lat = parseFloat(prompt("Enter latitude:"));
        const lng = parseFloat(prompt("Enter longitude:"));
        if (isNaN(lat) || isNaN(lng)) {
            alert("Invalid latitude or longitude.");
            return;
        }

        try {
            const res = await axios.post(API_CHECK_LOCATION, { lat, lng });
            if (res.data.inside) {
                alert(`Location is inside polygon: ${res.data.polygon_name}`);
            } else {
                alert("Location is outside all polygons.");
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div>
            <LoadScript googleMapsApiKey="AIzaSyAgaUdtKxRsjVSxrHuEh0pRx--_REQl-lU">
                <GoogleMap
                    onClick={handleMapClick}
                    mapContainerStyle={{ height: "80vh", width: "100%" }}
                    zoom={15}
                    center={center}
                    ref={mapRef}
                >
                    <Marker position={center} />
                    {polygons.map((poly, index) => (
                        <Polygon
                            key={index}
                            paths={poly.points}
                            options={{
                                fillColor: "#000",
                                fillOpacity: 0.4,
                                strokeColor: "#000",
                                strokeOpacity: 1,
                                strokeWeight: 2,
                                editable: true,
                                draggable: true
                            }}
                            onClick={() => alert(`Polygon Name: ${poly.name}`)}
                        />
                    ))}
                    {currentPolygon.length > 0 && (
                        <Polygon
                            paths={currentPolygon}
                            options={{
                                fillColor: "#FF0000",
                                fillOpacity: 0.5,
                                strokeColor: "#FF0000",
                                strokeOpacity: 1,
                                strokeWeight: 2,
                                editable: true,
                                draggable: true
                            }}
                        />
                    )}
                    {infoWindowPosition && (
                        <InfoWindow position={infoWindowPosition} onCloseClick={() => setInfoWindowPosition(null)}>
                            <div>{infoWindowContent}</div>
                        </InfoWindow>
                    )}
                </GoogleMap>
            </LoadScript>
            <ReactTooltip />
            <div style={{ padding: '10px' }}>
                <button onClick={() => setDrawingMode(true)}>Draw Polygon</button>
                <button onClick={handleSavePolygon}>Save Polygon</button>
                <button onClick={handleGenerateAutoPolygon}>Generate 10-min Polygon</button>
                <button onClick={checkLocation}>Check Location</button>
            </div>
        </div>
    );
};

export default MapComponent;
