import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Configurar ícone do marcador
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const getRandomPosition = (currentPosition) => {
  const latChange = (Math.random() - 0.5) * 0.01; // Mudança aleatória
  const lngChange = (Math.random() - 0.5) * 0.01;

  return {
    lat: currentPosition.lat + latChange,
    lng: currentPosition.lng + lngChange,
  };
};

const RealTimeLeafletMap = () => {
  const [truckPosition, setTruckPosition] = useState({
    lat: -23.5505,
    lng: -46.6333,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setTruckPosition((prevPosition) => getRandomPosition(prevPosition));
    }, 2000); // Atualiza a posição a cada 2 segundos

    return () => clearInterval(interval);
  }, []);

  return (
    <MapContainer
      center={truckPosition}
      zoom={13}
      style={{ height: "400px", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <Marker position={truckPosition} icon={icon}>
        <Popup>Posição do caminhão</Popup>
      </Marker>
    </MapContainer>
  );
};

export default RealTimeLeafletMap;
