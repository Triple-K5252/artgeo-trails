import { useEffect, useRef } from "react";

import WebMap from "@arcgis/core/WebMap";
import MapView from "@arcgis/core/views/MapView";
import Graphic from "@arcgis/core/Graphic";
import Polyline from "@arcgis/core/geometry/Polyline";

export default function RouteMap({
  stops = [],
  routePath = [],
  currentLocation = null,

}) {
  const mapDiv = useRef(null);
  const viewRef = useRef(null);

  // Create map once
  useEffect(() => {
    if (!mapDiv.current) return;

    const webmap = new WebMap({
      portalItem: {
        id: "937b4e8d66fc42bda0509eb3bbcd30e7",
      },
    });

    const view = new MapView({
      container: mapDiv.current,
      map: webmap,
    });

    viewRef.current = view;

    return () => {
      if (view) {
        view.destroy();
      }
    };
  }, []);

  // Update graphics whenever stops or route change
  useEffect(() => {
    const view = viewRef.current;

    if (!view) return;

    view.when(() => {
      view.graphics.removeAll();
     
      console.log(
  "RouteMap Location:",
  currentLocation
);
      


     if (currentLocation) {
  view.graphics.add(
    new Graphic({
      geometry: {
        type: "point",
        longitude:
          currentLocation.longitude,
        latitude:
          currentLocation.latitude,
      },

     symbol: {
  type: "simple-marker",
  color: [0, 120, 255],
  size: 14,
  outline: {
    color: "white",
    width: 2,
  },
},

      popupTemplate: {
        title: "You are here",
      },
    })
  );
}

      console.log("Selected Stops:", stops);
      console.log("Route Path:", routePath);

      // =====================
      // Draw Stop Markers
      // =====================
      stops.forEach((stop, index) => {
        if (!stop.geometry) return;

        const marker = new Graphic({
          geometry: stop.geometry,

          symbol: {
            type: "text",
            text: `${index + 1}`,

            color: "white",

            haloColor: [234, 88, 12],
            haloSize: 12,

            font: {
              size: 12,
              weight: "bold",
            },
          },

          attributes: {
            name: stop.name,
          },

          popupTemplate: {
            title: `${index + 1}. ${stop.name}`,
          },
        });

        view.graphics.add(marker);

        view.graphics.add(
          new Graphic({
            geometry: stop.geometry,

            symbol: {
              type: "text",

              text:
                index === 0
                  ? "START"
                  : index === stops.length - 1
                  ? "END"
                  : `${index}`,

              color: [0, 0, 0],

              haloColor: [255, 255, 255],
              haloSize: 2,

              yoffset: 20,

              font: {
                size: 10,
                weight: "bold",
              },
            },
          })
        );
      });

      // =====================
      // Draw OSRM Route
      // =====================
      if (routePath && routePath.length > 0) {
        const routeGraphic = new Graphic({
          geometry: new Polyline({
            paths: [routePath],
            spatialReference: {
              wkid: 4326,
            },
          }),

          symbol: {
            type: "simple-line",
            color: [234, 88, 12],
            width: 5,
          },
        });

        view.graphics.add(routeGraphic);
      }

      // =====================
      // Fallback Straight Line
      // (Useful for testing)
      // =====================
      else if (stops.length > 1) {
        const path = stops
          .filter((stop) => stop.geometry)
          .map((stop) => [
            stop.geometry.longitude ?? stop.geometry.x,
            stop.geometry.latitude ?? stop.geometry.y,
          ]);

        const straightLine = new Graphic({
          geometry: new Polyline({
            paths: [path],
            spatialReference: {
              wkid: 4326,
            },
          }),

          symbol: {
            type: "simple-line",
            color: [150, 150, 150],
            width: 2,
            style: "dash",
          },
        });

        view.graphics.add(straightLine);
      }

      // =====================
      // Zoom to graphics
      // =====================
      if (view.graphics.length > 0) {
        view.goTo(view.graphics).catch(() => {});
      }
    });
  }, [
  stops,
  routePath,
  currentLocation,
]);

  return (
    <div
      ref={mapDiv}
      style={{
        width: "100%",
        height: "100%",
      }}
    />
  );
}