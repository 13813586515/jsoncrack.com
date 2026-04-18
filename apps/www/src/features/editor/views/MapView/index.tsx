import React, { useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from "react-leaflet";
import L from "leaflet";
import { Box, Text, ScrollArea, Badge, Group, Card, Divider } from "@mantine/core";
import { useTheme } from "styled-components";
import useJson from "../../../../store/useJson";

import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface LocationPoint {
  id: string;
  lat: number;
  lng: number;
  name: string;
  properties: Record<string, unknown>;
}

interface GeoJSONData {
  type: string;
  features?: unknown[];
  geometry?: unknown;
  properties?: Record<string, unknown>;
}

const extractLatLng = (obj: Record<string, unknown>): { lat: number; lng: number } | null => {
  const latKeys = ["lat", "latitude", "y"];
  const lngKeys = ["lng", "longitude", "lon", "x", "long"];

  let lat: number | null = null;
  let lng: number | null = null;

  for (const key of latKeys) {
    if (obj[key] !== undefined && obj[key] !== null) {
      const value = Number(obj[key]);
      if (!isNaN(value)) {
        lat = value;
        break;
      }
    }
  }

  for (const key of lngKeys) {
    if (obj[key] !== undefined && obj[key] !== null) {
      const value = Number(obj[key]);
      if (!isNaN(value)) {
        lng = value;
        break;
      }
    }
  }

  if (obj.coordinates && Array.isArray(obj.coordinates) && obj.coordinates.length >= 2) {
    lng = Number(obj.coordinates[0]);
    lat = Number(obj.coordinates[1]);
  }

  if (obj.geometry) {
    const geometry = obj.geometry as Record<string, unknown>;
    if (geometry.coordinates && Array.isArray(geometry.coordinates) && geometry.coordinates.length >= 2) {
      lng = Number(geometry.coordinates[0]);
      lat = Number(geometry.coordinates[1]);
    }
  }

  if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)) {
    return { lat, lng };
  }

  return null;
};

const extractLocationName = (obj: Record<string, unknown>, index: number): string => {
  const nameKeys = ["name", "title", "location", "place", "city", "address", "id"];
  for (const key of nameKeys) {
    const value = obj[key];
    if (value !== undefined && value !== null && typeof value === "string") {
      return value;
    }
  }
  return `Location ${index + 1}`;
};

const isValidLatLng = (lat: number, lng: number): boolean => {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
};

const MapBoundsSetter: React.FC<{ bounds: [[number, number], [number, number]] }> = ({ bounds }) => {
  const map = useMap();

  React.useEffect(() => {
    if (bounds && bounds[0] && bounds[1]) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, bounds]);

  return null;
};

export const MapView = () => {
  const theme = useTheme();
  const json = useJson(state => state.json);
  const [error, setError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<LocationPoint | null>(null);

  const { locations, geoJsonData } = useMemo<{
    locations: LocationPoint[];
    geoJsonData: GeoJSONData | null;
  }>(() => {
    try {
      setError(null);
      const parsed = JSON.parse(json);
      const locations: LocationPoint[] = [];
      let geoJsonData: GeoJSONData | null = null;

      if (parsed.type === "FeatureCollection" || parsed.type === "Feature") {
        geoJsonData = parsed;
      }

      if (parsed.features && Array.isArray(parsed.features)) {
        parsed.features.forEach((feature: Record<string, unknown>, index: number) => {
          const latLng = extractLatLng(feature);
          if (latLng && isValidLatLng(latLng.lat, latLng.lng)) {
            locations.push({
              id: `feature-${index}`,
              lat: latLng.lat,
              lng: latLng.lng,
              name: extractLocationName({ ...feature, ...(feature.properties as Record<string, unknown>) }, index),
              properties: {
                ...feature,
                ...(feature.properties as Record<string, unknown>),
              },
            });
          }
        });
      }

      if (Array.isArray(parsed)) {
        parsed.forEach((item: Record<string, unknown>, index: number) => {
          if (typeof item === "object" && item !== null) {
            const latLng = extractLatLng(item);
            if (latLng && isValidLatLng(latLng.lat, latLng.lng)) {
              locations.push({
                id: `location-${index}`,
                lat: latLng.lat,
                lng: latLng.lng,
                name: extractLocationName(item, index),
                properties: item,
              });
            }
          }
        });
      } else if (typeof parsed === "object" && parsed !== null && !parsed.type) {
        const latLng = extractLatLng(parsed);
        if (latLng && isValidLatLng(latLng.lat, latLng.lng)) {
          locations.push({
            id: "location-0",
            lat: latLng.lat,
            lng: latLng.lng,
            name: extractLocationName(parsed, 0),
            properties: parsed,
          });
        }
      }

      if (locations.length === 0 && !geoJsonData) {
        setError("当前数据不包含位置信息。请确保数据包含 lat/lng、coordinates 或 GeoJSON 格式的位置数据。");
      }

      return { locations, geoJsonData };
    } catch (e) {
      setError("JSON 解析失败，请检查数据格式");
      return { locations: [], geoJsonData: null };
    }
  }, [json]);

  const mapCenter: [number, number] = useMemo(() => {
    if (locations.length > 0) {
      const avgLat = locations.reduce((sum, loc) => sum + loc.lat, 0) / locations.length;
      const avgLng = locations.reduce((sum, loc) => sum + loc.lng, 0) / locations.length;
      return [avgLat, avgLng];
    }
    return [39.9042, 116.4074];
  }, [locations]);

  const bounds: [[number, number], [number, number]] | null = useMemo(() => {
    if (locations.length < 1) return null;

    const lats = locations.map(l => l.lat);
    const lngs = locations.map(l => l.lng);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    return [
      [minLat, minLng],
      [maxLat, maxLng],
    ];
  }, [locations]);

  const onEachFeature = (feature: unknown, layer: L.Layer) => {
    if (feature && typeof feature === "object" && "properties" in feature) {
      const props = (feature as { properties: Record<string, unknown> }).properties;
      const popupContent = Object.entries(props)
        .map(([key, value]) => `<strong>${key}:</strong> ${value}`)
        .join("<br>");
      layer.bindPopup(popupContent);
    }
  };

  if (error) {
    return (
      <Box p="xl" style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Text size="lg" c="dimmed" ta="center">
          {error}
        </Text>
      </Box>
    );
  }

  const MapContainerAny = MapContainer as any;
  const TileLayerAny = TileLayer as any;
  const GeoJSONAny = GeoJSON as any;

  return (
    <Box h="100%" style={{ background: theme.BACKGROUND_SECONDARY, display: "flex" }}>
      <Box style={{ width: "70%", height: "100%", position: "relative" }}>
        <MapContainerAny
          center={mapCenter}
          zoom={locations.length === 1 ? 12 : 4}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayerAny
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {bounds && locations.length > 1 && <MapBoundsSetter bounds={bounds} />}

          {locations.map(location => (
            <Marker
              key={location.id}
              position={[location.lat, location.lng]}
              eventHandlers={{
                click: () => setSelectedLocation(location),
              }}
            >
              <Popup>
                <div>
                  <strong>{location.name}</strong>
                  <br />
                  纬度: {location.lat.toFixed(6)}
                  <br />
                  经度: {location.lng.toFixed(6)}
                </div>
              </Popup>
            </Marker>
          ))}

          {geoJsonData && <GeoJSONAny data={geoJsonData} onEachFeature={onEachFeature} />}
        </MapContainerAny>
      </Box>

      <Box style={{ width: "30%", height: "100%", borderLeft: `1px solid ${theme.GRID_COLOR_PRIMARY}` }}>
        <Box p="md" style={{ borderBottom: `1px solid ${theme.GRID_COLOR_PRIMARY}` }}>
          <Text fw={600}>位置列表</Text>
          {locations.length > 0 && <Badge mt="sm">{locations.length} 个位置点</Badge>}
        </Box>

        <ScrollArea h="calc(100% - 70px)">
          {selectedLocation && (
            <Card m="sm" p="md" style={{ background: theme.BACKGROUND_PRIMARY }}>
              <Text fw={600} mb="sm">
                {selectedLocation.name}
              </Text>
              <Group mb="sm">
                <Badge variant="light">纬度: {selectedLocation.lat.toFixed(6)}</Badge>
                <Badge variant="light">经度: {selectedLocation.lng.toFixed(6)}</Badge>
              </Group>
              <Divider my="sm" />
              <Text size="sm" fw={500} mb="sm">
                属性信息:
              </Text>
              <ScrollArea h={200}>
                {Object.entries(selectedLocation.properties).map(([key, value]) => (
                  <Box key={key} py="xs" style={{ borderBottom: `1px solid ${theme.GRID_COLOR_PRIMARY}` }}>
                    <Text size="xs" c="dimmed">
                      {key}
                    </Text>
                    <Text size="sm">
                      {typeof value === "object" ? JSON.stringify(value, null, 2) : String(value)}
                    </Text>
                  </Box>
                ))}
              </ScrollArea>
            </Card>
          )}

          {!selectedLocation &&
            locations.map(location => (
              <Card
                key={location.id}
                m="sm"
                p="md"
                style={{
                  background: theme.BACKGROUND_PRIMARY,
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
                onClick={() => setSelectedLocation(location)}
              >
                <Text fw={500}>{location.name}</Text>
                <Text size="xs" c="dimmed" mt="sm">
                  {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                </Text>
              </Card>
            ))}
        </ScrollArea>
      </Box>
    </Box>
  );
};
