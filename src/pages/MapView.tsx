import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { MapPin, Trash2, Battery, Wifi, Navigation } from "lucide-react";
import { useState, useEffect } from "react";
import L from 'leaflet';
import "leaflet/dist/leaflet.css";
import binIconUrl from '@/assets/smart-bin-icon.png';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import { useRef } from 'react';
import polyline from '@mapbox/polyline';

import { getDustbins, type Dustbin } from "@/lib/dataStore";

// TODO: Insert your OpenRouteService API key below
const ORS_API_KEY = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImNlYjU0MGNjYjJiOTQ4Mjg5ZmNhYmYyODVjYzBiOGJkIiwiaCI6Im11cm11cjY0In0=";

// Helper component to zoom and center on marker click
function ZoomToMarker({ position }: { position: { lat: number; lng: number } }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView([position.lat, position.lng], 16, { animate: true });
    }
  }, [position, map]);
  return null;
}

const indiaCenter = { lat: 22.5937, lng: 78.9629 }; // Center of India
const indiaZoom = 5;

const MapView = () => {
  const [selectedBin, setSelectedBin] = useState<Dustbin | null>(null);
  const [dustbins, setDustbins] = useState<Dustbin[]>([]);
  const [mapPosition, setMapPosition] = useState<{ lat: number; lng: number }>(indiaCenter);
  const [mapZoom, setMapZoom] = useState<number>(indiaZoom);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBins, setSelectedBins] = useState<Dustbin[]>([]);
  const [routeCoords, setRouteCoords] = useState<Array<[number, number]>>([]);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    getDustbins().then(setDustbins);
  }, []);

  // Custom marker icon
  const binIcon = new L.Icon({
    iconUrl: binIconUrl,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
    shadowUrl: undefined,
    shadowSize: undefined,
    shadowAnchor: undefined
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "critical": return "destructive";
      case "warning": return "warning";
      case "good": return "success";
      default: return "secondary";
    }
  };

  const getMarkerColor = (status: string) => {
    switch (status) {
      case "critical": return "bg-destructive";
      case "warning": return "bg-warning";
      case "good": return "bg-success";
      default: return "bg-secondary";
    }
  };

  const getBatteryColor = (level: number) => {
    if (level > 50) return "text-success";
    if (level > 20) return "text-warning";
    return "text-destructive";
  };

  const getSignalColor = (strength: number) => {
    if (strength > 70) return "text-success";
    if (strength > 40) return "text-warning";
    return "text-destructive";
  };

  const handleListClick = (bin: Dustbin) => {
    setSelectedBin(bin);
    setMapPosition(bin.coordinates);
    setMapZoom(16);
    setSelectedBins(prev => {
      if (prev.find(b => b.id === bin.id)) {
        // Deselect if already selected
        return prev.filter(b => b.id !== bin.id);
      } else if (prev.length < 2) {
        // Add if less than 2 selected
        return [...prev, bin];
      } else {
        // Replace the first selected if already 2
        return [prev[1], bin];
      }
    });
  };

  // Fetch route from OpenRouteService
  async function fetchRoute(start: { lat: number, lng: number }, end: { lat: number, lng: number }) {
    const apiKey = ORS_API_KEY;
    const url = `https://api.openrouteservice.org/v2/directions/driving-car`;
    const body = {
      coordinates: [
        [start.lng, start.lat],
        [end.lng, end.lat]
      ]
    };
    console.log('Requesting route for:', [start.lng, start.lat], [end.lng, end.lat]);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiKey
      },
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      console.error('Route API error:', await response.text());
      return [];
    }
    const data = await response.json();
    if (!data.routes || !data.routes[0]) {
      console.error('No route found:', data);
      return [];
    }
    // Decode the polyline
    const coords = polyline.decode(data.routes[0].geometry);
    return coords;
  }

  // Watch for two selected bins and fetch route
  useEffect(() => {
    async function getRoute() {
      if (selectedBins.length === 2) {
        const coords = await fetchRoute(selectedBins[0].coordinates, selectedBins[1].coordinates);
        setRouteCoords(coords);
        // Fit map to route
        if (coords.length > 1 && mapRef.current) {
          const bounds = L.latLngBounds(coords);
          mapRef.current.fitBounds(bounds, { padding: [40, 40] });
        }
      } else {
        setRouteCoords([]);
      }
    }
    getRoute();
    // eslint-disable-next-line
  }, [selectedBins]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Map View</h1>
          <p className="text-muted-foreground">Interactive map showing all dustbin locations and status</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2" onClick={() => { setMapPosition(indiaCenter); setMapZoom(indiaZoom); setSelectedBin(null); }}>
            <Navigation className="h-4 w-4" />
            Center Map
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-2 grid-rows-2 gap-4 h-[80vh]">
        {/* Map */}
        <div className="col-span-1 row-span-1">
          <Card className="h-full shadow-card">
            <CardContent className="p-0 h-full">
              <MapContainer
                center={mapPosition}
                zoom={mapZoom}
                style={{ height: "100%", width: "100%" }}
                ref={mapRef}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="&copy; OpenStreetMap contributors"
                />
                {dustbins.map((bin) => (
                  <Marker
                    key={bin.id}
                    position={bin.coordinates && bin.coordinates.lat && bin.coordinates.lng ? bin.coordinates : indiaCenter}
                    icon={binIcon}
                    eventHandlers={{
                      click: () => {
                        setSelectedBin(bin);
                        setMapPosition(bin.coordinates);
                        setMapZoom(16);
                      }
                    }}
                  >
                    <Popup>
                      <div className="font-semibold">{bin.id}</div>
                      <div className="text-xs text-muted-foreground">{bin.location}</div>
                      <div className="text-xs">Fill: {bin.fillLevel}%</div>
                    </Popup>
                  </Marker>
                ))}
                {selectedBin && <ZoomToMarker position={selectedBin.coordinates} />}
                {/* Draw actual route if two bins are selected */}
                {routeCoords.length > 1 && (
                  <Polyline
                    positions={routeCoords}
                    pathOptions={{ color: 'blue', weight: 5 }}
                  />
                )}
              </MapContainer>
            </CardContent>
          </Card>
        </div>
        {/* Dustbin Locations */}
        <div className="col-span-1 row-span-1">
          <Card className="h-full shadow-card">
            <CardHeader>
              <CardTitle className="text-base">Dustbin Locations</CardTitle>
            </CardHeader>
            <CardContent className="overflow-y-auto max-h-[40vh] p-2">
              <ul className="space-y-2">
                {dustbins.map((bin) => (
                  <li key={bin.id}>
                    <button
                      className={`w-full text-left px-3 py-2 rounded hover:bg-primary/10 ${selectedBins.find(b => b.id === bin.id) ? 'bg-primary/20 font-semibold border border-primary' : ''}`}
                      onClick={() => handleListClick(bin)}
                    >
                      <span className="block text-sm">{bin.location}</span>
                      <span className="block text-xs text-muted-foreground">ID: {bin.id}</span>
                    </button>
                  </li>
                ))}
              </ul>
              {selectedBins.length === 2 && (
                <div className="mt-2 text-xs text-primary font-semibold">Route will be shown between selected bins.</div>
              )}
            </CardContent>
          </Card>
        </div>
        {/* Dustbin Details */}
        <div className="col-span-1 row-span-1">
          <Card className="h-full shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Dustbin Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedBin ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">{selectedBin.id}</h3>
                    <Badge variant={getStatusColor(selectedBin.status)}>
                      {selectedBin.status.charAt(0).toUpperCase() + selectedBin.status.slice(1)}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3 inline mr-1" />
                    {selectedBin.location}
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Fill Level</span>
                      <span className="font-medium">{selectedBin.fillLevel}%</span>
                    </div>
                    <Progress value={selectedBin.fillLevel} className="h-3" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Battery className={`h-4 w-4 ${getBatteryColor(selectedBin.batteryLevel)}`} />
                      <div>
                        <p className="text-xs text-muted-foreground">Battery</p>
                        <p className="font-medium">{selectedBin.batteryLevel}%</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Wifi className={`h-4 w-4 ${getSignalColor(selectedBin.signalStrength)}`} />
                      <div>
                        <p className="text-xs text-muted-foreground">Signal</p>
                        <p className="font-medium">{selectedBin.signalStrength}%</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Emptied:</span>
                      <span>{selectedBin.lastEmptied}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Temperature:</span>
                      <span>{selectedBin.temperature}°C</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Coordinates:</span>
                      <span className="text-xs">
                        {selectedBin.coordinates.lat.toFixed(4)}, {selectedBin.coordinates.lng.toFixed(4)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Trash2 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">
                    Click on a dustbin marker or location to view its details
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        {/* Quick Stats */}
        <div className="col-span-1 row-span-1">
          <Card className="h-full shadow-card">
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Bins Shown:</span>
                  <span className="font-medium">{dustbins.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Critical Status:</span>
                  <span className="font-medium text-destructive">
                    {dustbins.filter(bin => bin.status === 'critical').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Warning Status:</span>
                  <span className="font-medium text-warning">
                    {dustbins.filter(bin => bin.status === 'warning').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Good Status:</span>
                  <span className="font-medium text-success">
                    {dustbins.filter(bin => bin.status === 'good').length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MapView;