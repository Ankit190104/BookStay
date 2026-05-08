// Example starter JavaScript for disabling form submissions if there are invalid fields
(() => {
  'use strict'

  // Fetch all the forms we want to apply custom Bootstrap validation styles to
  const forms = document.querySelectorAll('.needs-validation')

  // Loop over them and prevent submission
  Array.from(forms).forEach(form => {
    form.addEventListener('submit', event => {
      if (!form.checkValidity()) {
        event.preventDefault()
        event.stopPropagation()
      }

      form.classList.add('was-validated')
    }, false)
  })
})()

// Booking Price Calculation
document.addEventListener("DOMContentLoaded", () => {
    const checkIn = document.getElementById("check-in");
    const checkOut = document.getElementById("check-out");
    const pricePerNightStr = document.getElementById("price-per-night")?.innerText.replace(/,/g, "");
    const pricePerNight = parseFloat(pricePerNightStr);
    
    const breakdown = document.getElementById("price-breakdown");
    const numNightsLabel = document.getElementById("num-nights");
    const baseTotalLabel = document.getElementById("base-total");
    const finalTotalLabel = document.getElementById("final-total");

    function calculatePrice() {
        if (checkIn.value && checkOut.value) {
            const start = new Date(checkIn.value);
            const end = new Date(checkOut.value);
            
            if (end > start) {
                const diffTime = Math.abs(end - start);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                const baseTotal = diffDays * pricePerNight;
                const finalTotal = baseTotal + 500 + 1200; // base + cleaning + service

                numNightsLabel.innerText = diffDays;
                baseTotalLabel.innerText = baseTotal.toLocaleString("en-IN");
                finalTotalLabel.innerText = finalTotal.toLocaleString("en-IN");
                
                breakdown.classList.remove("hidden");
            } else {
                breakdown.classList.add("hidden");
            }
        }
    }

    if (checkIn && checkOut) {
        checkIn.addEventListener("change", calculatePrice);
        checkOut.addEventListener("change", calculatePrice);
    }
});

async function toggleWishlist(event, id) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    try {
        const response = await fetch(`/wishlist/${id}`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (data.success) {
            const btns = document.querySelectorAll(`[data-id="${id}"]`);
            btns.forEach(btn => {
                const icon = btn.querySelector('.wishlist-icon');
                const text = btn.querySelector('.wishlist-text');
                if (data.added) {
                    if (icon) {
                        icon.classList.remove('fa-regular', 'text-white', 'opacity-80');
                        icon.classList.add('fa-solid', 'text-primary');
                    }
                    if (text) text.innerText = 'Saved';
                } else {
                    if (icon) {
                        icon.classList.remove('fa-solid', 'text-primary');
                        icon.classList.add('fa-regular', 'text-white', 'opacity-80');
                    }
                    if (text) text.innerText = 'Save';
                }
            });
        } else {
            window.location.href = '/login';
        }
    } catch (err) {
        console.error("Wishlist Error:", err);
        // Fallback for non-logged in users or errors
        window.location.href = '/login';
    }
}

function shareListing() {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
        alert("Link copied to clipboard!");
    }).catch(err => {
        console.error("Failed to copy: ", err);
    });
}

// Real-time Search Logic
let searchTimeout;
const searchInputs = document.querySelectorAll('input[name="search"]');
const listingsGrid = document.getElementById('listings-grid');

if (searchInputs.length > 0 && listingsGrid) {
    searchInputs.forEach(input => {
        input.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const query = e.target.value;
            
            searchTimeout = setTimeout(async () => {
                try {
                    const response = await fetch(`/listings?search=${query}&ajax=true`);
                    const html = await response.text();
                    listingsGrid.innerHTML = html;
                    
                    // Re-initialize tax toggle if needed or any other JS
                } catch (err) {
                    console.error("Search Error:", err);
                }
            }, 300); // 300ms debounce
        });
    });
}

// Real-time Category Filter Logic
const categoryFilters = document.querySelectorAll('.category-filter');
if (categoryFilters.length > 0 && listingsGrid) {
    categoryFilters.forEach(filter => {
        filter.addEventListener('click', async (e) => {
            e.preventDefault();
            const category = filter.getAttribute('data-category');
            
            // Visual feedback
            categoryFilters.forEach(f => f.classList.remove('opacity-100', 'text-primary'));
            filter.classList.add('opacity-100', 'text-primary');

            try {
                const response = await fetch(`/listings?category=${category}&ajax=true`);
                const html = await response.text();
                listingsGrid.innerHTML = html;
                
                // Update URL without reload
                window.history.pushState({}, '', `/listings?category=${category}`);
            } catch (err) {
                console.error("Filter Error:", err);
            }
        });
    });
}

// Dark Mode Toggle Logic
const themeToggleBtn = document.getElementById('dark-mode-toggle');
if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', function() {
        // Toggle class
        document.documentElement.classList.toggle('dark');
        
        // Save preference
        if (document.documentElement.classList.contains('dark')) {
            localStorage.setItem('color-theme', 'dark');
        } else {
            localStorage.setItem('color-theme', 'light');
        }
    });
}

// Back to Top Button
const backToTopBtn = document.createElement('button');
backToTopBtn.innerHTML = '<i class="fa-solid fa-arrow-up"></i>';
backToTopBtn.className = 'fixed bottom-24 right-6 md:bottom-8 md:right-8 bg-primary text-white w-12 h-12 rounded-full shadow-2xl items-center justify-center hidden z-50 hover:bg-primaryHover transition-all transform hover:scale-110';
document.body.appendChild(backToTopBtn);

window.addEventListener('scroll', () => {
    if (window.scrollY > 500) {
        backToTopBtn.style.display = 'flex';
    } else {
        backToTopBtn.style.display = 'none';
    }
});

backToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Map Explorer Toggle Logic
document.addEventListener("DOMContentLoaded", () => {
    const toggleMapBtn = document.getElementById('toggle-map-btn');
    const mapView = document.getElementById('map-view');
    const listingsGrid = document.getElementById('listings-grid');
    const filtersSec = document.getElementById('filters');

    if (toggleMapBtn && mapView && listingsGrid) {
        let mapInitialized = false;
        let map;

        toggleMapBtn.addEventListener('click', () => {
            const isMapHidden = mapView.classList.contains('hidden');
            
            if (isMapHidden) {
                // Show Map, Hide Grid
                listingsGrid.classList.add('hidden');
                if (filtersSec) filtersSec.classList.add('opacity-0', 'pointer-events-none');
                mapView.classList.remove('hidden');
                toggleMapBtn.querySelector('#btn-text').innerText = 'Show List';
                toggleMapBtn.querySelector('#btn-icon').className = 'fa-solid fa-list';
                
                if (!mapInitialized) {
                    initializeMainMap();
                    mapInitialized = true;
                }
            } else {
                // Show Grid, Hide Map
                mapView.classList.add('hidden');
                if (filtersSec) filtersSec.classList.remove('opacity-0', 'pointer-events-none');
                listingsGrid.classList.remove('hidden');
                toggleMapBtn.querySelector('#btn-text').innerText = 'Show Map';
                toggleMapBtn.querySelector('#btn-icon').className = 'fa-solid fa-map';
            }
        });

        function initializeMainMap() {
            if (!mapToken || mapToken === "") {
                console.error("Mapbox token is missing!");
                return;
            }

            mapboxgl.accessToken = mapToken;
            map = new mapboxgl.Map({
                container: 'main-map',
                style: 'mapbox://styles/mapbox/streets-v12',
                center: [78.9629, 20.5937],
                zoom: 4
            });

            if (listingsData && listingsData.features) {
                listingsData.features.forEach(listing => {
                    if (listing.geometry && listing.geometry.coordinates) {
                        const el = document.createElement('div');
                        el.className = 'bg-white dark:bg-gray-800 px-3 py-1.5 rounded-full shadow-lg border border-gray-100 dark:border-gray-700 font-bold text-sm cursor-pointer hover:scale-110 transition-transform';
                        el.innerHTML = `₹${listing.price.toLocaleString("en-IN")}`;

                        new mapboxgl.Marker(el)
                            .setLngLat(listing.geometry.coordinates)
                            .setPopup(
                                new mapboxgl.Popup({ offset: 25 })
                                    .setHTML(
                                        `<div class="p-2 min-w-[200px]">
                                            <img src="${listing.image.url}" class="w-full h-32 object-cover rounded-xl mb-2">
                                            <h4 class="font-bold text-gray-800">${listing.title}</h4>
                                            <p class="text-xs text-gray-500">${listing.location}</p>
                                            <a href="/listings/${listing._id}" class="text-xs text-primary font-bold mt-2 block hover:underline">View Details</a>
                                        </div>`
                                    )
                            )
                            .addTo(map);
                    }
                });

                if (listingsData.features.length > 0) {
                    const bounds = new mapboxgl.LngLatBounds();
                    listingsData.features.forEach(listing => {
                        if (listing.geometry) bounds.extend(listing.geometry.coordinates);
                    });
                    map.fitBounds(bounds, { padding: 100, maxZoom: 10 });
                }
            }
        }
    }
});