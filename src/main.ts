import './style.css'
import { Map, LngLat, LngLatBounds, Marker, Popup } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import * as geojson from 'geojson'
import { bbox } from "@turf/bbox"
import { parse } from 'yaml'

const init = async () => {
  const events = await fetch('/osgeojp-events-2025/events.yml')
  const eventsText = await events.text()
  const eventsData = parse(eventsText)
  const geojson = eventDataToGeoJSON(eventsData)
  const _bbox = bbox(geojson)
  const bounds = convertBboxToBounds(_bbox)
  const map = new Map({
    container: 'map',
    style: 'https://demotiles.maplibre.org/style.json',
    center: [0, 0],
    zoom: 2,
    pitch: 0,
    bearing: 0,
    hash: true,
  })

  map.on('load', () => {
    map.fitBounds(bounds, {
      padding: {top: 10, bottom:25, left: 15, right: 5},
      duration: 2000,
    })
    eventsData.forEach((event: any) => {
      const marker = new Marker()
        .setLngLat([event.location.longitude, event.location.latitude])
        .addTo(map)

      const popup = new Popup({ offset: 25 })
        .setHTML(`
          <h3>${event.name}</h3>
          <p>${event.date}</p>
          <p>${event.location.name}</p>
          <p>${event.location.address}</p>
          <a href="${event.homepage}" target="_blank">イベントページ</a>
        `)
        .setMaxWidth('300px')

      marker.setPopup(popup)
    })
  })

  map.on('zoomend', () => {
    if (map.getZoom() > 10) {
      map.setStyle("https://tile.openstreetmap.jp/styles/osm-bright-ja/style.json")
    } else {
      map.setStyle("https://demotiles.maplibre.org/style.json")
    }
  })
}

const eventDataToGeoJSON = (eventsData: any): geojson.FeatureCollection => {
  const features = eventsData.map((event: any) => {
    return {
      type: 'Feature',
      properties: {
        name: event.name,
        date: event.date,
        location_name: event.location.name,
        location_address: event.location.address,
      },
      geometry: {
        type: 'Point',
        coordinates: [event.location.longitude, event.location.latitude],
      },
    }
  })

  return {
    type: 'FeatureCollection',
    features,
  }
}

const convertBboxToBounds = (bbox: number[]): LngLatBounds => {
  const sw = new LngLat(bbox[0], bbox[1])
  const ne = new LngLat(bbox[2], bbox[3])
  return new LngLatBounds(sw, ne)
}

init()