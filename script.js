const map = L.map('map', {
    center: [43.7734091, -79.5052312],
    zoom: 18,
    zoomControl: false // Disable default zoom control position
});

// Add zoom control with custom position
L.control.zoom({ position: 'bottomright' }).addTo(map);

// Define multiple tile layers
const tileLayers = {
    osm: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }),
    topographic: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', { maxZoom: 19 }),
};

// Set default layer and add it to map
let currentLayer = tileLayers.osm;
let currentOpacity = 1;
currentLayer.setOpacity(currentOpacity);
currentLayer.addTo(map);

// L.control.layers(tileLayers, null, { position: 'bottomright' }).addTo(map);

// Handle tile layer change
document.getElementById('tileSelector').addEventListener('change', (event) => {
    const selectedLayer = event.target.value;

    // Remove current layer and add the selected layer
    if (currentLayer) {
        map.removeLayer(currentLayer);
    }
    currentLayer = tileLayers[selectedLayer];
    currentLayer.setOpacity(currentOpacity);
    currentLayer.addTo(map);
});

// Handle opacity change
document.getElementById('opacitySlider').addEventListener('input', (event) => {
    const opacity = event.target.value / 100;
    currentOpacity = opacity;
    currentLayer.setOpacity(opacity);
});


// Hexagon storage
let hexagons = {};

// Add hexagon by ID or list of IDs
document.getElementById('addHexagonBtn').addEventListener('click', () => {
    const hexagonInput = document.getElementById('hexagonInput').value.trim();
    const color = document.getElementById('colorPicker').value;
    const hexIds = hexagonInput.split(/\s+/); // Split by spaces

    hexIds.forEach(hexId => {
        if (!h3.h3IsValid(hexId)) {
            alert(`Invalid hexagon ID: ${hexId}`);
            return;
        }
        addOrUpdateHexagon(hexId, color);
    });
    renderHexagonList();
});

// Map click handler to add hexagon by clicking on map
map.on('click', (e) => {
    const hexRes = document.getElementById('hexResolution').value;
    const hexId = h3.geoToH3(e.latlng.lat, e.latlng.lng, hexRes); // Adjust resolution here
    const color = document.getElementById('colorPicker').value;
    addOrUpdateHexagon(hexId, color);
    renderHexagonList();
});

// Function to add or update a hexagon
function addOrUpdateHexagon(hexId, color) {
    // Remove existing hexagon if present
    if (hexagons[hexId]) {
        hexagons[hexId].polygon.remove();
    }

    const hexBoundary = h3.h3ToGeoBoundary(hexId).map(coord => [coord[0], coord[1]]);
    const hexPolygon = L.polygon(hexBoundary, {
        color,
        fillColor: color
    }).addTo(map);

    text = ''; // Default text

    hexagons[hexId] = { color, text, polygon: hexPolygon };
}

// Render the list of hexagons in the panel
function renderHexagonList() {
    const listContainer = document.getElementById('hexagonsListContainer');
    listContainer.innerHTML = ''; // Clear the list

    if (Object.keys(hexagons).length === 0) {
        listContainer.innerHTML = '<p class="text-center text-gray-500">No hexagons added yet</p>';
        return
    }

    Object.keys(hexagons).forEach(hexId => {
        const hexInfo = hexagons[hexId];

        // Create a container for each hexagon item
        const hexItem = document.createElement('div');
        hexItem.classList.add('collapse', 'collapse-plus', 'join-item', 'border-black', 'border');
        hexItem.style.backgroundColor = hexInfo.color;

        hexItem.innerHTML = `
            <input type="radio" name="my-accordion-4" />
            <div class="collapse-title text-l font-medium">ID: ${hexId}</div>
            <div class="collapse-content">
                <label for="hexColor-${hexId}">Color:</label>
                <input type="text" id="hexColor-${hexId}" value="${hexInfo.color}" class="input input-bordered w-full max-w-xs" data-coloris />
                <label for="hexText-${hexId}">Text:</label>
                <input type="text" id="hexText-${hexId}" class="input input-bordered w-full max-w-xs" placeholder="Enter text" value="${hexInfo.text}" />
                <button class="btn w-full btn-error mt-1" id="hexDelete-${hexId}">Delete</button>
            </div>
        `;

        listContainer.appendChild(hexItem);

        const colorInput = document.getElementById(`hexColor-${hexId}`);
        colorInput.addEventListener('input', (event) => {
            hexInfo.color = event.target.value;
            hexItem.style.backgroundColor = hexInfo.color;
            updateHexagon(hexId);
        });

        const textInput = document.getElementById(`hexText-${hexId}`);
        textInput.addEventListener('input', (event) => {
            hexInfo.text = event.target.value;
            updateHexagon(hexId);
        });

        const deleteBtn = document.getElementById(`hexDelete-${hexId}`);
        deleteBtn.addEventListener('click', (event) => {
            deleteHexagon(hexId);
        });
    });
}

function updateHexagon(hexId) {
    const hexInfo = hexagons[hexId];
    if (hexInfo.polygon) {
        hexInfo.polygon.remove();

        const hexBoundary = h3.h3ToGeoBoundary(hexId).map(coord => [coord[0], coord[1]]);
        const updatedPolygon = L.polygon(hexBoundary, {
            color: hexInfo.color,
            fillColor: hexInfo.color
        }).addTo(map);

        if (hexInfo.text.length > 0) {
            // bind a transparent backround toolltip permanent
            updatedPolygon.bindTooltip(hexInfo.text, { permanent: true, direction: 'center' });

        }
        hexInfo.polygon = updatedPolygon; // Update reference
    }
}

function deleteHexagon(hexId) {
    if (hexagons[hexId]) {
        hexagons[hexId].polygon.remove();
        delete hexagons[hexId];
        renderHexagonList();
    }
}

document.getElementById('togglePanelBtn').addEventListener('click', () => {
    const panel = document.getElementById('panel');
    const toggleButton = document.getElementById('togglePanelBtn');

    // Toggle the 'hidden' class on the panel
    panel.classList.toggle('hidden');

    // Update button text based on panel visibility
    if (panel.classList.contains('hidden')) {
        toggleButton.textContent = '>>';
    } else {
        toggleButton.textContent = '<<';
    }
});