  import { useState, useEffect, useRef, useMemo } from 'react'
  import { Link } from 'react-router-dom'
  import mapboxgl from 'mapbox-gl'
  import { Activity, TrendingUp, Shield, Layers, MapPin, BarChart3, Filter, ChevronUp, ChevronDown, RefreshCw } from 'lucide-react'
  import 'mapbox-gl/dist/mapbox-gl.css'

  mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_KEY

  function MapView({ crimeData, stats, loading, selectedCrimeTypes, availableCrimeTypes, toggleCrimeType, selectAllCrimeTypes, deselectAllCrimeTypes, onRefresh }) {
    const mapContainer = useRef(null)
    const map = useRef(null)
    const [mapStyle, setMapStyle] = useState('dark')
    const [showFilters, setShowFilters] = useState(true)
    const [mapLoaded, setMapLoaded] = useState(false)

    // Drawer state for mobile stats panel
    const [drawerOpen, setDrawerOpen] = useState(false)
    const drawerRef = useRef(null)
    const dragStartY = useRef(null)
    const dragStartOpen = useRef(null)

    // Draggable filter panel state
    const [filterPanelPos, setFilterPanelPos] = useState({ x: window.innerWidth - 360, y: 20 })
    const [isDraggingFilter, setIsDraggingFilter] = useState(false)
    const filterPanelRef = useRef(null)
    const dragOffset = useRef({ x: 0, y: 0 })

    // Draggable stats panel state
    const [statsPanelPos, setStatsPanelPos] = useState({ x: 20, y: 20 })
    const [isDraggingStats, setIsDraggingStats] = useState(false)
    const statsPanelRef = useRef(null)
    const statsDragOffset = useRef({ x: 0, y: 0 })

    // Stats panel collapse state
    const [showStats, setShowStats] = useState(true)

    // Drawer state for mobile filters panel
    const [filtersDrawerOpen, setFiltersDrawerOpen] = useState(false)
    const filtersDrawerRef = useRef(null)

    // Touch drag to open/close drawer
    const handleTouchStart = (e) => {
      dragStartY.current = e.touches[0].clientY
      dragStartOpen.current = drawerOpen
    }
    const handleTouchEnd = (e) => {
      if (dragStartY.current === null) return
      const delta = dragStartY.current - e.changedTouches[0].clientY
      if (delta > 40) setDrawerOpen(true)
      else if (delta < -40) setDrawerOpen(false)
      dragStartY.current = null
    }

    // Touch drag for filters drawer
    const handleFiltersTouchStart = (e) => {
      dragStartY.current = e.touches[0].clientY
      dragStartOpen.current = filtersDrawerOpen
    }
    const handleFiltersTouchEnd = (e) => {
      if (dragStartY.current === null) return
      const delta = dragStartY.current - e.changedTouches[0].clientY
      if (delta > 40) setFiltersDrawerOpen(true)
      else if (delta < -40) setFiltersDrawerOpen(false)
      dragStartY.current = null
    }

    // Draggable filter panel handlers
    const handleFilterPanelMouseDown = (e) => {
      // Only start drag from the header area
      if (e.target.closest('.filter-panel-drag-handle')) {
        setIsDraggingFilter(true)
        dragOffset.current = {
          x: e.clientX - filterPanelPos.x,
          y: e.clientY - filterPanelPos.y
        }
        e.preventDefault()
      }
    }

    // Draggable stats panel handlers
    const handleStatsPanelMouseDown = (e) => {
      // Only start drag from the header area
      if (e.target.closest('.stats-panel-drag-handle')) {
        setIsDraggingStats(true)
        statsDragOffset.current = {
          x: e.clientX - statsPanelPos.x,
          y: e.clientY - statsPanelPos.y
        }
        e.preventDefault()
      }
    }

    useEffect(() => {
      const handleMouseMove = (e) => {
        if (isDraggingFilter) {
          const newX = e.clientX - dragOffset.current.x
          const newY = e.clientY - dragOffset.current.y
          
          // Constrain to viewport bounds
          const maxX = window.innerWidth - (filterPanelRef.current?.offsetWidth || 320)
          const maxY = window.innerHeight - (filterPanelRef.current?.offsetHeight || 100)
          
          setFilterPanelPos({
            x: Math.max(0, Math.min(newX, maxX)),
            y: Math.max(0, Math.min(newY, maxY))
          })
        }
        if (isDraggingStats) {
          const newX = e.clientX - statsDragOffset.current.x
          const newY = e.clientY - statsDragOffset.current.y
          
          // Constrain to viewport bounds
          const maxX = window.innerWidth - (statsPanelRef.current?.offsetWidth || 320)
          const maxY = window.innerHeight - (statsPanelRef.current?.offsetHeight || 100)
          
          setStatsPanelPos({
            x: Math.max(0, Math.min(newX, maxX)),
            y: Math.max(0, Math.min(newY, maxY))
          })
        }
      }

      const handleMouseUp = () => {
        setIsDraggingFilter(false)
        setIsDraggingStats(false)
      }

      const handleResize = () => {
        // Adjust position if window is resized to keep panels in bounds
        setFilterPanelPos(prev => {
          const maxX = window.innerWidth - (filterPanelRef.current?.offsetWidth || 320)
          const maxY = window.innerHeight - (filterPanelRef.current?.offsetHeight || 100)
          return {
            x: Math.max(0, Math.min(prev.x, maxX)),
            y: Math.max(0, Math.min(prev.y, maxY))
          }
        })
        setStatsPanelPos(prev => {
          const maxX = window.innerWidth - (statsPanelRef.current?.offsetWidth || 320)
          const maxY = window.innerHeight - (statsPanelRef.current?.offsetHeight || 100)
          return {
            x: Math.max(0, Math.min(prev.x, maxX)),
            y: Math.max(0, Math.min(prev.y, maxY))
          }
        })
      }

      if (isDraggingFilter || isDraggingStats) {
        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)
      }

      window.addEventListener('resize', handleResize)

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        window.removeEventListener('resize', handleResize)
      }
    }, [isDraggingFilter, isDraggingStats, filterPanelPos, statsPanelPos])

    const mapStyles = {
      satellite: 'mapbox://styles/mapbox/satellite-v9',
      streets: 'mapbox://styles/mapbox/streets-v12',
      light: 'mapbox://styles/mapbox/light-v11',
      dark: 'mapbox://styles/mapbox/dark-v11',
      outdoors: 'mapbox://styles/mapbox/outdoors-v12'
    }

    // Filter crime data based on selected types
    const filteredCrimeData = useMemo(() => {
      if (selectedCrimeTypes.size === 0) return crimeData
      return crimeData.filter(crime => 
        selectedCrimeTypes.has(crime.crime_type?.toLowerCase())
      )
    }, [crimeData, selectedCrimeTypes])

    const toggleMapStyle = () => {
      const newStyle = mapStyle === 'satellite' ? 'streets' : 'satellite'
      setMapStyle(newStyle)
      if (map.current) {
        map.current.setStyle(mapStyles[newStyle])
      }
    }

    // Update map when filters change
    useEffect(() => {
      if (mapLoaded && map.current && map.current.getSource('crimes')) {
        map.current.getSource('crimes').setData({
          type: 'FeatureCollection',
          features: filteredCrimeData.map(crime => ({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [crime.longitude, crime.latitude]
            },
            properties: {
              id: crime.fir_number,
              crime_type: crime.crime_type,
              severity: crime.severity_level,
              date: crime.incident_date,
              title: crime.title,
              description: crime.description,
              image_url: crime.image_url,
              location: crime.location,
              source: crime.source,
              news_url: crime.news_url,
              weight: crime.severity_level === 'Critical' ? 4 : 
                    crime.severity_level === 'High' ? 3 : 
                    crime.severity_level === 'Medium' ? 2 : 1
            }
          }))
        })
      }
    }, [filteredCrimeData, mapLoaded])

    useEffect(() => {
      if (!mapContainer.current) {
        console.log('Map container not ready')
        return
      }
      if (map.current) {
        console.log('Map already initialized')
        return // Prevent re-initialization
      }

      console.log('Initializing map...')
      
      // Initialize map with globe projection
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: mapStyles[mapStyle],
        center: [72.8777, 19.0760],
        zoom: 3,
        pitch: 60,
        bearing: 0,
        projection: 'globe',
        minZoom: 1,
        maxZoom: 18
      })

      console.log('Map instance created:', map.current)

      // Add controls
      map.current.addControl(new mapboxgl.NavigationControl({
        visualizePitch: true,
        showCompass: true,
        showZoom: true
      }), 'top-right')

      map.current.addControl(new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserLocation: true,
        showUserHeading: true
      }), 'top-right')


      map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right')



      // Custom controls
      class ResetGlobeControl {
        onAdd(map) {
          this._map = map
          this._container = document.createElement('div')
          this._container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group'
          this._container.innerHTML = `
            <button class="control-button" title="Reset to Globe View">
              <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>
              </svg>
            </button>
          `
          this._container.addEventListener('click', () => {
            map.flyTo({ center: [72.8777, 19.0760], zoom: 3, pitch: 60, bearing: 0, duration: 2000 })
          })
          return this._container
        }
        onRemove() {
          this._container.parentNode.removeChild(this._container)
          this._map = undefined
        }
      }
      map.current.addControl(new ResetGlobeControl(), 'top-right')

      class FocusMumbaiControl {
        onAdd(map) {
          this._map = map
          this._container = document.createElement('div')
          this._container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group'
          this._container.innerHTML = `
            <button class="control-button" title="Focus on Mumbai">
              <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26"  viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
              </svg>
            </button>
          `
          this._container.addEventListener('click', () => {
            map.flyTo({ center: [72.8777, 19.0760], zoom: 11, pitch: 60, bearing: 0, duration: 2000 })
          })
          return this._container
        }
        onRemove() {
          this._container.parentNode.removeChild(this._container)
          this._map = undefined
        }
      }
      map.current.addControl(new FocusMumbaiControl(), 'top-right')

      class MapStyleControl {
        onAdd(map) {
          this._map = map
          this._container = document.createElement('div')
          this._container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group'
          this._container.innerHTML = `
            <button id="style-toggle-btn" class="control-button" title="Toggle Satellite/Street View">
              <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
              </svg>
            </button>
          `
          return this._container
        }
        onRemove() {
          this._container.parentNode.removeChild(this._container)
          this._map = undefined
        }
      }
      map.current.addControl(new MapStyleControl(), 'top-right')

      setTimeout(() => {
        const styleBtn = document.getElementById('style-toggle-btn')
        if (styleBtn) {
          styleBtn.addEventListener('click', toggleMapStyle)
        }
      }, 100)

      map.current.on('style.load', () => {
        map.current.setFog({
          'horizon-blend': 0.1,
          'color': '#303036',
          'high-color': '#245cdf',
          'space-color': '#000',
          'star-intensity': 0.15
        })

        // Add 3D buildings layer
        const layers = map.current.getStyle().layers
        const labelLayerId = layers.find(
          (layer) => layer.type === 'symbol' && layer.layout['text-field']
        )?.id

        if (labelLayerId) {
          map.current.addLayer(
            {
              id: 'add-3d-buildings',
              source: 'composite',
              'source-layer': 'building',
              filter: ['==', 'extrude', 'true'],
              type: 'fill-extrusion',
              minzoom: 15,
              paint: {
                'fill-extrusion-color': '#aaa',
                'fill-extrusion-height': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  15,
                  0,
                  15.05,
                  ['get', 'height']
                ],
                'fill-extrusion-base': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  15,
                  0,
                  15.05,
                  ['get', 'min_height']
                ],
                'fill-extrusion-opacity': 0.6
              }
            },
            labelLayerId
          )
        }
      })

      map.current.on('load', () => {
        console.log('Map loaded event fired. Crime data count:', filteredCrimeData.length)
        map.current.addSource('crimes', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: filteredCrimeData.map(crime => ({
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [crime.longitude, crime.latitude]
              },
              properties: {
                id: crime.fir_number,
                crime_type: crime.crime_type,
                severity: crime.severity_level,
                date: crime.incident_date,
                title: crime.title,
                description: crime.description,
                image_url: crime.image_url,
                location: crime.location,
                source: crime.source,
                news_url: crime.news_url,
                weight: crime.severity_level === 'Critical' ? 4 : 
                      crime.severity_level === 'High' ? 3 : 
                      crime.severity_level === 'Medium' ? 2 : 1
              }
            }))
          }
        })

        map.current.addLayer({
    id: 'crime-heatmap',
    type: 'heatmap',
    source: 'crimes',
    maxzoom: 15,
    paint: {
      // Weight: linear contribution per crime severity weight
      'heatmap-weight': [
        'interpolate', ['linear'], ['get', 'weight'],
        0, 0,
        1, 0.4,
        2, 0.8,
        3, 1.4,
        4, 2.0
      ],

      // Intensity: ramp up as you zoom in
      'heatmap-intensity': [
        'interpolate', ['linear'], ['zoom'],
        0, 1,
        5, 2,
        10, 3,
        15, 5
      ],

      // Color: intuitive cool-to-hot ramp (blue → cyan → yellow → orange → red)
      'heatmap-color': [
        'interpolate', ['linear'], ['heatmap-density'],
        0,    'rgba(0,0,0,0)',
        0.05, 'rgba(25,85,200,0.5)',
        0.15, 'rgba(30,160,220,0.7)',
        0.30, 'rgba(60,210,180,0.85)',
        0.45, 'rgba(240,230,50,0.9)',
        0.60, 'rgba(255,160,20,1)',
        0.75, 'rgba(255,80,0,1)',
        0.90, 'rgba(220,10,30,1)',
        1.0,  'rgba(140,0,20,1)'
      ],

      // Radius: tight at low zoom, expands meaningfully when zoomed in
      'heatmap-radius': [
        'interpolate', ['linear'], ['zoom'],
        0,  15,
        5,  25,
        10, 40,
        13, 55,
        15, 70
      ],

      // Opacity: fade out gracefully at high zoom where points take over
      'heatmap-opacity': [
        'interpolate', ['linear'], ['zoom'],
        10, 1,
        14, 0.6,
        15, 0
      ]
    }
  }, 'waterway-label')

  map.current.addLayer({
    id: 'crime-points',
    type: 'circle',
    source: 'crimes',
    minzoom: 10, // Only show when zoomed in enough to distinguish points
    paint: {
      // Radius: modest base, grows with weight and zoom
      'circle-radius': [
        'interpolate', ['linear'], ['zoom'],
        10, ['interpolate', ['linear'], ['get', 'weight'], 1, 4,  2, 6,  3, 8,  4, 10],
        13, ['interpolate', ['linear'], ['get', 'weight'], 1, 6,  2, 9,  3, 12, 4, 15],
        16, ['interpolate', ['linear'], ['get', 'weight'], 1, 8,  2, 12, 3, 16, 4, 20]
      ],

      // Fill color by severity — refined, distinct palette
      'circle-color': [
        'match', ['get', 'severity'],
        'Low',      '#34D399', // emerald green
        'Medium',   '#FBBF24', // amber
        'High',     '#F97316', // orange
        'Critical', '#EF4444', // red
        '#94A3B8'              // slate fallback
      ],

      // Stroke color mirrors fill for visual reinforcement, slightly darker
      'circle-stroke-color': [
        'match', ['get', 'severity'],
        'Low',      '#059669',
        'Medium',   '#D97706',
        'High',     '#C2410C',
        'Critical', '#991B1B',
        '#475569'
      ],
      'circle-stroke-width': 2,
      'circle-opacity': [
        'interpolate', ['linear'], ['zoom'],
        10, 0,   // fade in as heatmap fades out
        12, 0.85,
        14, 1
      ]
    }
  })

        map.current.on('click', 'crime-points', (e) => {
    const coordinates = e.features[0].geometry.coordinates.slice()
    const props = e.features[0].properties

    const severityColor = {
      Critical: '#ef4444',
      High:     '#f97316',
      Medium:   '#fbbf24',
      Low:      '#34d399',
    }[props.severity] || '#94a3b8'

    const severityBg = {
      Critical: 'rgba(239,68,68,0.12)',
      High:     'rgba(249,115,22,0.12)',
      Medium:   'rgba(251,191,36,0.12)',
      Low:      'rgba(52,211,153,0.12)',
    }[props.severity] || 'rgba(148,163,184,0.1)'

    const popup = new mapboxgl.Popup({
      maxWidth: '340px',
      className: 'crime-popup',
    })
      .setLngLat(coordinates)
      .setHTML(`
        <style>
          .crime-popup .mapboxgl-popup-content {
            background: #0d0d0d;
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 14px;
            padding: 0;
            box-shadow: 0 24px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04);
            overflow: hidden;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          }
          .crime-popup .mapboxgl-popup-tip {
            border-top-color: #0d0d0d;
          }
          .crime-popup .mapboxgl-popup-close-button {
            color: #6b7280;
            font-size: 18px;
            padding: 10px 12px;
            line-height: 1;
            z-index: 10;
          }
          .crime-popup .mapboxgl-popup-close-button:hover {
            color: #e5e7eb;
            background: rgba(255,255,255,0.05);
          }
        </style>

        <div style="width: 320px;">

          ${props.image_url ? `
            <div style="position: relative;">
              <img
                src="${props.image_url}"
                style="width: 100%; height: 160px; object-fit: cover; display: block;"
                onerror="this.parentElement.style.display='none'"
              />
              <div style="position: absolute; inset: 0; background: linear-gradient(to bottom, transparent 40%, #0d0d0d 100%);"></div>
            </div>
          ` : `
            <div style="height: 6px; background: linear-gradient(90deg, ${severityColor}88, ${severityColor}22);"></div>
          `}

          <div style="padding: 18px 18px 6px;">

            <!-- Title + severity badge -->
            <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; margin-bottom: 14px;">
              <h3 style="margin: 0; font-size: 15px; font-weight: 600; color: #f1f5f9; line-height: 1.4; flex: 1;">
                ${props.title || 'Crime Incident'}
              </h3>
              <span style="
                flex-shrink: 0;
                font-size: 11px;
                font-weight: 600;
                letter-spacing: 0.06em;
                text-transform: uppercase;
                color: ${severityColor};
                background: ${severityBg};
                border: 1px solid ${severityColor}44;
                padding: 3px 9px;
                border-radius: 999px;
              ">${props.severity || 'Unknown'}</span>
            </div>

            <!-- Details rows -->
            <div style="
              background: rgba(255,255,255,0.03);
              border: 1px solid rgba(255,255,255,0.06);
              border-radius: 10px;
              overflow: hidden;
              margin-bottom: 14px;
            ">
              ${[
                { label: 'Type',     value: props.crime_type || 'N/A', accent: true },
                { label: 'Location', value: props.location   || 'N/A' },
                { label: 'Date',     value: props.date       || 'N/A' },
              ].map((row, i, arr) => `
                <div style="
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  padding: 9px 13px;
                  ${i < arr.length - 1 ? 'border-bottom: 1px solid rgba(255,255,255,0.05);' : ''}
                ">
                  <span style="font-size: 12px; color: #6b7280; font-weight: 500;">${row.label}</span>
                  <span style="font-size: 12px; color: ${row.accent ? '#e2e8f0' : '#cbd5e1'}; font-weight: ${row.accent ? '500' : '400'}; text-align: right; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${row.value}</span>
                </div>
              `).join('')}
            </div>

          </div>

          ${props.news_url ? `
            <div style="padding: 0 18px 18px;">
              <a
                href="${props.news_url}"
                target="_blank"
                style="
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  gap: 7px;
                  padding: 9px 16px;
                  background: rgba(255,255,255,0.05);
                  border: 1px solid rgba(255,255,255,0.09);
                  color: #e2e8f0;
                  text-decoration: none;
                  border-radius: 8px;
                  font-size: 12px;
                  font-weight: 500;
                  letter-spacing: 0.02em;
                  transition: background 0.15s;
                "
                onmouseover="this.style.background='rgba(255,255,255,0.09)'"
                onmouseout="this.style.background='rgba(255,255,255,0.05)'"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
                Read Full Article
              </a>
            </div>
          ` : '<div style="height: 4px;"></div>'}

        </div>
      `)
      .addTo(map.current)
  })

        map.current.on('mouseenter', 'crime-points', () => {
          map.current.getCanvas().style.cursor = 'pointer'
        })
        map.current.on('mouseleave', 'crime-points', () => {
          map.current.getCanvas().style.cursor = ''
        })

        // Add 3D buildings layer with dark styling
        try {
          const layers = map.current.getStyle().layers
          const labelLayerId = layers.find(
            (layer) => layer.type === 'symbol' && layer.layout && layer.layout['text-field']
          )?.id

          map.current.addLayer(
            {
              id: '3d-buildings',
              source: 'composite',
              'source-layer': 'building',
              filter: ['==', 'extrude', 'true'],
              type: 'fill-extrusion',
              minzoom: 15,
              paint: {
                'fill-extrusion-color': '#131314',
                'fill-extrusion-height': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  15,
                  0,
                  15.05,
                  ['get', 'height']
                ],
                'fill-extrusion-base': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  15,
                  0,
                  15.05,
                  ['get', 'min_height']
                ],
                'fill-extrusion-opacity': 1
              }
            },
            labelLayerId
          )
        } catch (error) {
          console.log('3D buildings layer not added:', error)
        }
        
        // Mark map as loaded
        console.log('Map fully loaded and ready')
        setMapLoaded(true)
      })

      return () => {
        console.log('Cleaning up map...')
        if (map.current) {
          map.current.remove()
          map.current = null
        }
        setMapLoaded(false)
      }
    }, [])

    // The stats panel content — shared between desktop and mobile drawer
  const SEVERITY_CONFIG = [
    { label: 'Low',      color: '#4ade80', bg: 'rgba(74,222,128,0.1)',  border: 'rgba(74,222,128,0.2)'  },
    { label: 'Medium',   color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.2)'  },
    { label: 'High',     color: '#f97316', bg: 'rgba(249,115,22,0.1)',  border: 'rgba(249,115,22,0.2)'  },
    { label: 'Critical', color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.2)'   },
  ]

  const row = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  }

  const muted = {
    fontSize: '11px', fontWeight: '600', letterSpacing: '0.07em',
    textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)',
  }

  const innerCard = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '10px',
    padding: '12px 14px',
  }

  const divider = {
    height: '1px',
    background: 'rgba(255,255,255,0.06)',
    margin: '4px 0',
  }

  const StatsPanelContent = () => {
    const [isRefreshing, setIsRefreshing] = useState(false)

    const handleRefresh = async () => {
      setIsRefreshing(true)
      await onRefresh()
      setTimeout(() => setIsRefreshing(false), 600)
    }

    return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

      {/* Header */}
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            padding: '7px', borderRadius: '9px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
          }}>
            <Activity size={14} color="rgba(255,255,255,0.5)" />
          </div>
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#e5e5e5', letterSpacing: '-0.01em' }}>
          Map Legend
          </h3>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          style={{
            padding: '7px',
            borderRadius: '9px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: isRefreshing ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            opacity: isRefreshing ? 0.5 : 1,
          }}
          onMouseEnter={(e) => {
            if (!isRefreshing) {
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
          }}
        >
          <RefreshCw 
            size={14} 
            color="rgba(255,255,255,0.5)" 
            style={{
              transform: isRefreshing ? 'rotate(360deg)' : 'rotate(0deg)',
              transition: 'transform 0.6s ease',
            }}
          />
        </button>
      </div>

      {/* Summary Stats */}
      <div style={innerCard}>
        <div style={{ ...row, marginBottom: '10px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', ...muted }}>
            <Shield size={12} /> Showing
          </span>
          <span style={{ fontSize: '15px', fontWeight: '700', color: '#e5e5e5', letterSpacing: '-0.02em' }}>
            {filteredCrimeData.length}
            <span style={{ fontSize: '12px', fontWeight: '400', color: 'rgba(255,255,255,0.3)', marginLeft: '3px' }}>
              / {crimeData.length}
            </span>
          </span>
        </div>
        <div style={divider} />
        <div style={{ ...row, marginTop: '10px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', ...muted }}>
            <Layers size={12} /> Style
          </span>
          <span style={{ fontSize: '12px', fontWeight: '600', color: 'rgba(255,255,255,0.6)' }}>
            {mapStyle.charAt(0).toUpperCase() + mapStyle.slice(1)}
          </span>
        </div>
      </div>

      {/* Heatmap Gradient */}
      <div style={innerCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
          <TrendingUp size={12} color="rgba(255,255,255,0.4)" />
          <span style={muted}>Heatmap Intensity</span>
        </div>
        <div style={{
          height: '8px', borderRadius: '999px', marginBottom: '6px',
          background: 'linear-gradient(90deg, rgba(25,85,200,0.7), rgba(60,210,180,0.9), rgba(255,200,30,1), rgba(255,80,0,1), rgba(220,10,30,1))',
        }} />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          {['None', 'Low', 'High', 'Critical'].map(l => (
            <span key={l} style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', fontWeight: '500' }}>{l}</span>
          ))}
        </div>
      </div>

      {/* Severity Breakdown */}
      <div style={innerCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
          <MapPin size={12} color="rgba(255,255,255,0.4)" />
          <span style={muted}>Incident Markers</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
          {SEVERITY_CONFIG.map(({ label, color, bg, border }) => {
            const count = stats?.severity_levels.find(s => s._id === label)?.count || 0
            const total = crimeData.length || 1
            const pct = Math.round((count / total) * 100)
            return (
              <div key={label}>
                <div style={{ ...row, marginBottom: '5px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <div style={{
                      width: '8px', height: '8px', borderRadius: '3px',
                      background: color, flexShrink: 0,
                    }} />
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', fontWeight: '500' }}>
                      {label}
                    </span>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.8)' }}>
                    {count}
                  </span>
                </div>
                {/* Progress bar */}
                <div style={{
                  height: '3px', borderRadius: '999px',
                  background: 'rgba(255,255,255,0.05)', overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%', borderRadius: '999px',
                    width: `${pct}%`, background: color,
                    transition: 'width 0.4s ease',
                  }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Analytics Link */}
      <Link
        to="/analytics"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
          padding: '11px 14px', borderRadius: '10px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.09)',
          color: 'rgba(255,255,255,0.6)',
          textDecoration: 'none', fontWeight: '600', fontSize: '13px',
          transition: 'all 0.15s', letterSpacing: '0.01em',
        }}
        onMouseOver={e => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)'
          e.currentTarget.style.color = '#e5e5e5'
        }}
        onMouseOut={e => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'
          e.currentTarget.style.color = 'rgba(255,255,255,0.6)'
        }}
      >
        <BarChart3 size={15} />
        View Detailed Analytics
      </Link>

    </div>
    )
  }

    // The filters panel content — shared between desktop and mobile drawer
  const FiltersPanelContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

      {/* Header — collapsible */}
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: 'pointer', userSelect: 'none',
          paddingBottom: showFilters ? '10px' : '0',
          borderBottom: showFilters ? '1px solid rgba(255,255,255,0.06)' : 'none',
        }}
        onClick={() => setShowFilters(!showFilters)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            padding: '7px', borderRadius: '9px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
          }}>
            <Filter size={14} color="rgba(255,255,255,0.5)" />
          </div>
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#e5e5e5', letterSpacing: '-0.01em' }}>
            Crime Filters
          </h3>
        </div>
        <div style={{
          width: '20px', height: '20px', borderRadius: '6px',
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform 0.2s',
          transform: showFilters ? 'rotate(180deg)' : 'rotate(0deg)',
        }}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 4L5 7L8 4" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {showFilters && (
        <>
          {/* Select / Clear All */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { label: 'Select All', action: selectAllCrimeTypes,   color: '#4ade80', bg: 'rgba(74,222,128,0.08)',  border: 'rgba(74,222,128,0.18)'  },
              { label: 'Clear All',  action: deselectAllCrimeTypes,  color: '#ef4444', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.18)'   },
            ].map(({ label, action, color, bg, border }) => (
              <button
                key={label}
                onClick={action}
                style={{
                  flex: 1, padding: '8px 10px', borderRadius: '9px',
                  background: bg, border: `1px solid ${border}`,
                  color, fontSize: '11px', fontWeight: '700',
                  letterSpacing: '0.04em', textTransform: 'uppercase',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
                onMouseOver={e => { e.currentTarget.style.background = color.replace(')', ',0.18)').replace('rgb', 'rgba'); e.currentTarget.style.borderColor = color + '55' }}
                onMouseOut={e => { e.currentTarget.style.background = bg; e.currentTarget.style.borderColor = border }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Crime Type List */}
          <div style={{ maxHeight: '360px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '5px', paddingRight: '2px' }}>
            {availableCrimeTypes.map(type => {
              const isSelected = selectedCrimeTypes.has(type)
              const count = crimeData.filter(c => c.crime_type?.toLowerCase() === type).length

              return (
                <div
                  key={type}
                  onClick={() => toggleCrimeType(type)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '9px 12px', borderRadius: '9px', cursor: 'pointer',
                    userSelect: 'none', transition: 'all 0.15s',
                    background: isSelected ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${isSelected ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)'}`,
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.background = isSelected ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.05)'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.background = isSelected ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)'
                    e.currentTarget.style.borderColor = isSelected ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {/* Custom checkbox */}
                    <div style={{
                      width: '16px', height: '16px', borderRadius: '5px', flexShrink: 0,
                      border: `1.5px solid ${isSelected ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.15)'}`,
                      background: isSelected ? 'rgba(255,255,255,0.12)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s',
                    }}>
                      {isSelected && (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M2 5L4.5 7.5L8.5 2.5" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>

                    <span style={{
                      fontSize: '12px', fontWeight: isSelected ? '600' : '400',
                      color: isSelected ? '#e5e5e5' : 'rgba(255,255,255,0.4)',
                      textTransform: 'capitalize', transition: 'color 0.15s',
                    }}>
                      {type}
                    </span>
                  </div>

                  {/* Count pill */}
                  <span style={{
                    fontSize: '11px', fontWeight: '600',
                    padding: '2px 8px', borderRadius: '999px',
                    background: isSelected ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${isSelected ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.06)'}`,
                    color: isSelected ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.25)',
                    transition: 'all 0.15s',
                  }}>
                    {count}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Footer summary */}
          <div style={{
            padding: '10px 14px', borderRadius: '9px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
            fontSize: '12px', color: 'rgba(255,255,255,0.35)',
          }}>
            Showing
            <strong style={{ color: '#e5e5e5', fontWeight: '700', fontSize: '13px' }}>
              {filteredCrimeData.length}
            </strong>
            of
            <strong style={{ color: 'rgba(255,255,255,0.5)', fontWeight: '600' }}>
              {crimeData.length}
            </strong>
            crimes
          </div>
        </>
      )}
    </div>
  )

    return (
      <div style={{ position: 'relative', height: '100vh', width: '100%', overflow: 'hidden' }}>
        {loading && (
          <div className="loading-container" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999, background: '#000000', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div>Loading crime data from Mumbai...</div>
          </div>
        )}
        
        {/* Filter Panel - Right Side - Desktop only, hidden on mobile */}
        <div 
          ref={filterPanelRef}
          className="filter-panel filter-panel--desktop" 
          style={{
            position: 'absolute',
            top: `${filterPanelPos.y}px`,
            left: `${filterPanelPos.x}px`,
            background: 'rgba(0, 0, 0, 0.92)',
            backdropFilter: 'blur(20px)',
            padding: '20px',
            borderRadius: '16px',
            boxShadow: isDraggingFilter ? '0 12px 48px rgba(0, 0, 0, 0.9)' : '0 8px 32px rgba(0, 0, 0, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            maxWidth: '320px',
            zIndex: isDraggingFilter ? 1000 : 1,
            maxHeight: '90vh',
            overflowY: 'auto',
            cursor: isDraggingFilter ? 'grabbing' : 'default',
            userSelect: 'none',
            transition: isDraggingFilter ? 'none' : 'box-shadow 0.2s ease'
          }}
          onMouseDown={handleFilterPanelMouseDown}
        >
          {/* Drag handle indicator */}
          <div className="filter-panel-drag-handle" style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '10px',
            cursor: 'grab',
            padding: '4px 0'
          }}>
            <div style={{
              width: '40px',
              height: '4px',
              borderRadius: '999px',
              background: 'rgba(255,255,255,0.2)',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.4)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            />
          </div>
          <FiltersPanelContent />
        </div>

        {/* ── DESKTOP: Stats Panel (draggable, hidden on mobile) ── */}
        <div 
          ref={statsPanelRef}
          className="stats-panel stats-panel--desktop" 
          style={{
            position: 'absolute',
            top: `${statsPanelPos.y}px`,
            left: `${statsPanelPos.x}px`,
            background: 'rgba(0, 0, 0, 0.92)',
            backdropFilter: 'blur(20px)',
            padding: '20px',
            borderRadius: '16px',
            boxShadow: isDraggingStats ? '0 12px 48px rgba(0, 0, 0, 0.9)' : '0 8px 32px rgba(0, 0, 0, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            maxWidth: '320px',
            zIndex: isDraggingStats ? 1000 : 1,
            maxHeight: '90vh',
            overflowY: 'auto',
            cursor: isDraggingStats ? 'grabbing' : 'default',
            userSelect: 'none',
            transition: isDraggingStats ? 'none' : 'box-shadow 0.2s ease'
          }}
          onMouseDown={handleStatsPanelMouseDown}
        >
          {/* Drag handle indicator */}
          <div className="stats-panel-drag-handle" style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '10px',
            cursor: 'grab',
            padding: '4px 0'
          }}>
            <div style={{
              width: '40px',
              height: '4px',
              borderRadius: '999px',
              background: 'rgba(255,255,255,0.2)',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.4)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            />
          </div>
          <StatsPanelContent />
        </div>

        {/* ── MOBILE: Floating trigger buttons (top left, stacked vertically) ── */}
        <button
          className="stats-drawer-trigger"
          onClick={() => setDrawerOpen(v => !v)}
          aria-label="Toggle Crime Analytics"
        >
        
          <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em', marginTop: '2px' }}>
            {drawerOpen ? 'CLOSE' : 'STATS'}
          </span>
          {drawerOpen
            ? <ChevronDown size={14} style={{ marginTop: '1px' }} />
            : <ChevronUp size={14} style={{ marginTop: '1px' }} />
          }
        </button>

        <button
          className="filters-drawer-trigger"
          onClick={() => setFiltersDrawerOpen(v => !v)}
          aria-label="Toggle Crime Filters"
        >
          
          <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em', marginTop: '2px' }}>
            {filtersDrawerOpen ? 'CLOSE' : 'FILTER'}
          </span>
          {filtersDrawerOpen
            ? <ChevronDown size={14} style={{ marginTop: '1px' }} />
            : <ChevronUp size={14} style={{ marginTop: '1px' }} />
          }
        </button>

        {/* ── MOBILE: Stats drawer ── */}
        {/* Backdrop */}
        {drawerOpen && (
          <div
            className="stats-drawer-backdrop"
            onClick={() => setDrawerOpen(false)}
          />
        )}

        <div
          ref={drawerRef}
          className={`stats-drawer ${drawerOpen ? 'stats-drawer--open' : ''}`}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Drag handle */}
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '10px', paddingBottom: '4px' }}>
            <div style={{
              width: '40px',
              height: '4px',
              borderRadius: '999px',
              background: 'rgba(255,255,255,0.2)',
              cursor: 'grab'
            }} />
          </div>
          <div style={{ padding: '0 20px 100px 20px', overflowY: 'auto', maxHeight: '70vh' }}>
            <StatsPanelContent />
          </div>
        </div>

        {/* ── MOBILE: Filters drawer ── */}
        {/* Backdrop */}
        {filtersDrawerOpen && (
          <div
            className="filters-drawer-backdrop"
            onClick={() => setFiltersDrawerOpen(false)}
          />
        )}

        <div
          ref={filtersDrawerRef}
          className={`filters-drawer ${filtersDrawerOpen ? 'filters-drawer--open' : ''}`}
          onTouchStart={handleFiltersTouchStart}
          onTouchEnd={handleFiltersTouchEnd}
        >
          {/* Drag handle */}
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '10px', paddingBottom: '4px' }}>
            <div style={{
              width: '40px',
              height: '4px',
              borderRadius: '999px',
              background: 'rgba(255,255,255,0.2)',
              cursor: 'grab'
            }} />
          </div>
          <div style={{ padding: '0 20px 100px 20px', overflowY: 'auto', maxHeight: '70vh' }}>
            <FiltersPanelContent />
          </div>
        </div>

        {/* Inline styles for mobile-only elements */}
        <style>{`
          /* Trigger buttons — mobile only, stacked vertically on top left */
          .stats-drawer-trigger,
          .filters-drawer-trigger {
            display: none;
            position: fixed;
            left: 16px;
            z-index: 50;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 3px;
            width: 52px;
            height: 64px;
            border-radius: 16px;
            background: rgba(8, 8, 18, 0.92);
            border: 1px solid rgba(255,255,255,0.12);
            box-shadow: 0 4px 24px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06);
            color: #60a5fa;
            cursor: pointer;
            backdrop-filter: blur(16px);
            transition: transform 0.15s ease, box-shadow 0.15s ease;
          }
          
          .stats-drawer-trigger {
            top: 16px;
          }
          
          .filters-drawer-trigger {
            top: 88px; /* 16px + 64px (button height) + 8px gap */
            color: #a78bfa;
          }
          
          .stats-drawer-trigger:active,
          .filters-drawer-trigger:active {
            transform: scale(0.94);
          }

          /* Backdrops */
          .stats-drawer-backdrop,
          .filters-drawer-backdrop {
            display: none;
            position: fixed;
            inset: 0;
            z-index: 49;
            background: rgba(0,0,0,0.4);
            backdrop-filter: blur(2px);
          }

          /* Drawer panels */
          .stats-drawer,
          .filters-drawer {
            display: none;
            position: fixed;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 50;
            background: rgba(8, 8, 18, 0.97);
            border-top: 1px solid rgba(255,255,255,0.1);
            border-radius: 24px 24px 0 0;
            box-shadow: 0 -8px 40px rgba(0,0,0,0.7);
            transform: translateY(100%);
            transition: transform 0.35s cubic-bezier(0.32, 0.72, 0, 1);
            will-change: transform;
          }
          
          .stats-drawer--open,
          .filters-drawer--open {
            transform: translateY(0%);
          }

          /* Desktop panels stay visible on desktop */
          .stats-panel--desktop,
          .filter-panel--desktop {
            display: block;
          }

          @media (max-width: 768px) {
            .stats-drawer-trigger,
            .filters-drawer-trigger { display: flex; }
            .stats-drawer-backdrop,
            .filters-drawer-backdrop { display: block; }
            .stats-drawer,
            .filters-drawer { display: block; }
            .stats-panel--desktop,
            .filter-panel--desktop { display: none !important; }
          }
        `}</style>

        <div ref={mapContainer} className="map-container" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }} />
      </div>
    )
  }

  export default MapView