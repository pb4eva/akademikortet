const modPath = String.fromCharCode(46,47,108,101,97,102,108,101,116,46,106,115);
const L = await import(modPath);

const btn = document.getElementById('layersBtn');
const searchDrawer = document.getElementById('searchDrawer');
const layerDrawer = document.getElementById('layerDrawer');
const searchInput = document.getElementById('searchInput');

const allPins = new Array();
const layerGroups = {};
const layerColors = {};
let isDarkMode = true;

btn.addEventListener('click', () => {
  searchDrawer.classList.remove('open');
  layerDrawer.classList.toggle('open');
});

function goToPin(index) {
  const p = allPins.at(index);
  if (!p) return;
  if (!map.hasLayer(p.group)) map.addLayer(p.group);
  map.flyTo(p.latlng, 17);
  p.marker.openPopup();
  searchDrawer.classList.remove('open');
  searchInput.blur();
}

btn.textContent = 'Loading KML...';

const createMap = (el, opts) => L.map ? L.map(el, opts) : new L.Map(el, opts);
const createTile = (url, opts) => L.tileLayer ? L.tileLayer(url, opts) : new L.TileLayer(url, opts);
const createGroup = () => L.layerGroup ? L.layerGroup() : new L.LayerGroup();
const createLatLng = (lat, lng) => L.latLng ? L.latLng(lat, lng) : new L.LatLng(lat, lng);
const createBounds = () => L.latLngBounds ? L.latLngBounds() : new L.LatLngBounds();
const createCircle = (ll, opts) => L.circleMarker ? L.circleMarker(ll, opts) : new L.CircleMarker(ll, opts);
const createPoly = (pts, opts) => L.polyline ? L.polyline(pts, opts) : new L.Polyline(pts, opts);
const createPolygon = (pts, opts) => L.polygon ? L.polygon(pts, opts) : new L.Polygon(pts, opts);
const createPoint = (x, y) => L.point ? L.point(x, y) : new L.Point(x, y);

// Center directly on Sorø Akademi
const map = createMap('map', { zoomControl: false }).setView(new Array(55.4302, 11.5565), 16);

// Simplified Dark Basemap (Esri Dark Gray Canvas - Free, No API Key)
const darkBaseUrl = String.fromCharCode(
  104,116,116,112,115,58,47,47,115,101,114,118,101,114,46,97,114,99,103,105,115,
  46,99,111,109,47,65,114,99,71,73,83,47,114,101,115,116,47,115,101,114,118,105,
  99,101,115,47,67,97,110,118,97,115,47,87,111,114,108,100,95,68,97,114,107,95,
  71,114,97,121,95,66,97,115,101,47,77,97,112,83,101,114,118,101,114,47,116,105,
  108,101,47,123,122,125,47,123,121,125,47,123,120,125
);

// Simplified Dark Labels Overlay
const darkLabelsUrl = String.fromCharCode(
  104,116,116,112,115,58,47,47,115,101,114,118,101,114,46,97,114,99,103,105,115,
  46,99,111,109,47,65,114,99,71,73,83,47,114,101,115,116,47,115,101,114,118,105,
  99,101,115,47,67,97,110,118,97,115,47,87,111,114,108,100,95,68,97,114,107,95,
  71,114,97,121,95,82,101,102,101,114,101,110,99,101,47,77,97,112,83,101,114,118,
  101,114,47,116,105,108,101,47,123,122,125,47,123,121,125,47,123,120,125
);

// Light Simplified Basemap (Esri Light Gray Canvas)
const lightBaseUrl = String.fromCharCode(
  104,116,116,112,115,58,47,47,115,101,114,118,101,114,46,97,114,99,103,105,115,
  46,99,111,109,47,65,114,99,71,73,83,47,114,101,115,116,47,115,101,114,118,105,
  99,101,115,47,67,97,110,118,97,115,47,87,111,114,108,100,95,76,105,103,104,116,
  95,71,114,97,121,95,66,97,115,101,47,77,97,112,83,101,114,118,101,114,47,116,
  105,108,101,47,123,122,125,47,123,121,125,47,123,120,125
);

const darkBaseLayer = createTile(darkBaseUrl, { maxZoom: 19 });
const darkLabelsLayer = createTile(darkLabelsUrl, { maxZoom: 19 });
const lightBaseLayer = createTile(lightBaseUrl, { maxZoom: 19 });

darkBaseLayer.addTo(map);
darkLabelsLayer.addTo(map);

function setMapTheme(dark) {
  isDarkMode = dark;
  if (dark) {
    map.removeLayer(lightBaseLayer);
    darkBaseLayer.addTo(map);
    darkLabelsLayer.addTo(map);
  } else {
    map.removeLayer(darkBaseLayer);
    map.removeLayer(darkLabelsLayer);
    lightBaseLayer.addTo(map);
  }
}

setTimeout(() => { map.invalidateSize(); }, 300);

const palette = new Array('#0a84ff', '#30d158', '#ff9f0a', '#ff375f', '#bf5af2', '#64d2ff', '#ffd60a', '#ff453a', '#5e5ce6', '#32ade6');

function parseCoords(coordText) {
  const result = new Array();
  const pairs = coordText.trim().split(/\s+/);
  for (let i = 0; i < pairs.length; i++) {
    const parts = pairs.at(i).split(',');
    if (parts.length >= 2) {
      const lng = parseFloat(parts.at(0));
      const lat = parseFloat(parts.at(1));
      if (!isNaN(lat) && !isNaN(lng)) {
        result.push(createLatLng(lat, lng));
      }
    }
  }
  return result;
}

const kmlPath = String.fromCharCode(46,47,109,97,112,46,107,109,108);

fetch(kmlPath + '?v=' + Date.now())
  .then(res => {
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.text();
  })
  .then(kmlText => {
    const parser = new DOMParser();
    const kml = parser.parseFromString(kmlText, 'text/xml');
    let folders = Array.from(kml.getElementsByTagName('Folder'));
    if (folders.length === 0) folders = new Array(kml.documentElement);

    const bounds = createBounds();

    folders.forEach((folder, idx) => {
      const placemarks = Array.from(folder.getElementsByTagName('Placemark'));
      if (placemarks.length === 0) return;

      const nameNode = Array.from(folder.children).find(el => el.tagName === 'name');
      const layerName = nameNode ? nameNode.textContent.trim() : `Layer ${idx + 1}`;
      const color = palette.at(Object.keys(layerGroups).length % palette.length);
      const group = createGroup().addTo(map);

      layerGroups[layerName] = group;
      layerColors[layerName] = color;

      placemarks.forEach(pm => {
        const titleNode = pm.getElementsByTagName('name').item(0);
        const descNode = pm.getElementsByTagName('description').item(0);
        const title = titleNode ? titleNode.textContent.trim() : 'Unnamed Pin';
        const desc = descNode ? descNode.textContent.trim() : '';

        const popupHtml = `
          <div style="font-size:14px;font-weight:600;margin-bottom:2px;">${title}</div>
          <div style="font-size:11px;color:#8e8e93;margin-bottom:4px;">${layerName}</div>
          <div style="font-size:13px;line-height:1.35;">${desc}</div>
        `;

        const pointNode = pm.getElementsByTagName('Point').item(0);
        const lineNode = pm.getElementsByTagName('LineString').item(0);
        const polyNode = pm.getElementsByTagName('Polygon').item(0);

        if (pointNode) {
          const coordNode = pointNode.getElementsByTagName('coordinates').item(0);
          if (coordNode) {
            const coords = parseCoords(coordNode.textContent);
            if (coords.length > 0) {
              const ll = coords.at(0);
              const marker = createCircle(ll, {
                radius: 7,
                fillColor: color,
                color: '#ffffff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.95
              }).bindPopup(popupHtml).addTo(group);

              bounds.extend(ll);
              allPins.push({ title, desc, layerName, latlng: ll, marker, group });
            }
          }
        } else if (lineNode) {
          const coordNode = lineNode.getElementsByTagName('coordinates').item(0);
          if (coordNode) {
            const coords = parseCoords(coordNode.textContent);
            if (coords.length > 0) {
              const line = createPoly(coords, { color: color, weight: 3, opacity: 0.9 }).bindPopup(popupHtml).addTo(group);
              bounds.extend(line.getBounds());
              allPins.push({ title, desc, layerName, latlng: line.getBounds().getCenter(), marker: line, group });
            }
          }
        } else if (polyNode) {
          const coordNode = polyNode.getElementsByTagName('coordinates').item(0);
          if (coordNode) {
            const coords = parseCoords(coordNode.textContent);
            if (coords.length > 0) {
              const poly = createPolygon(coords, { color: color, weight: 2, fillOpacity: 0.25 }).bindPopup(popupHtml).addTo(group);
              bounds.extend(poly.getBounds());
              allPins.push({ title, desc, layerName, latlng: poly.getBounds().getCenter(), marker: poly, group });
            }
          }
        }
      });
    });

    map.invalidateSize();
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: createPoint(30, 30) });
    }
    btn.textContent = `Layers (${Object.keys(layerGroups).length})`;
    buildLayerDrawer();
  })
  .catch(err => {
    btn.textContent = 'KML: ' + err.message;
    console.error(err);
  });

function buildLayerDrawer() {
  layerDrawer.innerHTML = '';

  // Add Dark Simplified Map toggle at the top of the drawer
  const themeLabel = document.createElement('label');
  themeLabel.className = 'drawer-item';
  themeLabel.style.borderBottom = '1px solid rgba(255, 255, 255, 0.28)';
  themeLabel.style.fontWeight = '600';

  const themeText = document.createElement('span');
  themeText.textContent = 'Dark Simplified Map';

  const themeCheck = document.createElement('input');
  themeCheck.type = 'checkbox';
  themeCheck.checked = isDarkMode;
  themeCheck.addEventListener('change', () => setMapTheme(themeCheck.checked));

  themeLabel.appendChild(themeText);
  themeLabel.appendChild(themeCheck);
  layerDrawer.appendChild(themeLabel);

  // Add all KML layers below
  Object.keys(layerGroups).forEach(name => {
    const label = document.createElement('label');
    label.className = 'drawer-item';

    const spanWrap = document.createElement('span');
    spanWrap.className = 'layer-label';

    const dot = document.createElement('span');
    dot.className = 'color-dot';
    dot.style.background = layerColors[name];

    const textSpan = document.createElement('span');
    textSpan.textContent = name;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = true;
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) map.addLayer(layerGroups[name]);
      else map.removeLayer(layerGroups[name]);
    });

    spanWrap.appendChild(dot);
spanWrap.appendChild(textSpan);
label.appendChild(spanWrap);
label.appendChild(checkbox);
layerDrawer.appendChild(label);
});
}
searchInput.addEventListener('input', () => {
const q = searchInput.value.toLowerCase().trim();
layerDrawer.classList.remove('open');
if (!q) {
searchDrawer.classList.remove('open');
return;
}
const matches = allPins.filter(p =>
p.title.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q)
).slice(0, 25);
searchDrawer.innerHTML = '';
if (matches.length === 0) {
const empty = document.createElement('div');
empty.className = 'drawer-item';
empty.textContent = 'No matching pins';
searchDrawer.appendChild(empty);
} else {
matches.forEach(p => {
const item = document.createElement('div');
item.className = 'drawer-item';
item.style.flexDirection = 'column';
item.style.alignItems = 'flex-start';
const titleDiv = document.createElement('div');
titleDiv.textContent = p.title;
const subDiv = document.createElement('div');
subDiv.className = 'pin-sub';
subDiv.textContent = p.layerName;
item.appendChild(titleDiv);
item.appendChild(subDiv);
item.addEventListener('click', () => goToPin(allPins.indexOf(p)));
searchDrawer.appendChild(item);
});
}
searchDrawer.classList.add('open');
});
map.on('click', () => {
searchDrawer.classList.remove('open');
layerDrawer.classList.remove('open');
searchInput.blur();
});
document.addEventListener('touchmove', function(e) {
if (!e.target.closest('.drawer')) {
e.preventDefault();
}
}, { passive: false });
