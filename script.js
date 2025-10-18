// Theater seat booking system
(function() {
    'use strict';

    // Movie data
    const movies = {
        'avatar': {
            title: 'Avatar',
            time: '7:30 PM',
            occupancyRate: 0.65
        },
        'endgame': {
            title: 'Avengers: Endgame',
            time: '8:00 PM',
            occupancyRate: 0.75
        },
        'dark-knight': {
            title: 'The Dark Knight',
            time: '7:00 PM',
            occupancyRate: 0.55
        },
        'titanic': {
            title: 'Titanic',
            time: '6:30 PM',
            occupancyRate: 0.45
        },
        'inception': {
            title: 'Inception',
            time: '9:00 PM',
            occupancyRate: 0.50
        }
    };

    // Data structure for the theater
    const theaterData = {
        areas: [
            {
                id: 'front',
                name: 'Front Section',
                rows: ['A', 'B', 'C'],
                seatsPerRow: 10
            },
            {
                id: 'middle',
                name: 'Middle Section',
                rows: ['D', 'E', 'F', 'G'],
                seatsPerRow: 12
            },
            {
                id: 'back',
                name: 'Back Section',
                rows: ['H', 'I', 'J'],
                seatsPerRow: 10
            },
            {
                id: 'balcony',
                name: 'Balcony',
                rows: ['K', 'L'],
                seatsPerRow: 8
            }
        ]
    };

    // Seeded random number generator for consistent occupancy per movie
    function seededRandom(seed) {
        const x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    }

    // Generate complete seat map with movie-specific occupied seats
    function generateSeatMap(movieId) {
        const seatMap = [];
        const movie = movies[movieId];
        if (!movie) return seatMap;

        let seed = movieId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

        theaterData.areas.forEach(area => {
            area.rows.forEach(row => {
                const rowSeats = [];
                for (let i = 1; i <= area.seatsPerRow; i++) {
                    const seatId = `${row}${i}`;
                    const randomValue = seededRandom(seed++);
                    const isOccupied = randomValue < movie.occupancyRate;

                    rowSeats.push({
                        id: seatId,
                        row: row,
                        number: i,
                        status: isOccupied ? 'occupied' : 'available',
                        area: area.id
                    });
                }
                seatMap.push({
                    row: row,
                    seats: rowSeats,
                    area: area.id
                });
            });
        });

        return seatMap;
    }

    let seatMap = [];
    let selectedSeats = [];
    let currentView = 'full';
    let currentArea = null;
    let currentMovie = null;

    // Media query for responsive behavior
    const mobileBreakpoint = window.matchMedia('(max-width: 767px)');

    // Initialize the app
    function init() {
        // Movie selection event listeners
        $('.movie-card').on('click', function() {
            const movieId = $(this).data('movie-id');
            selectMovie(movieId);
        });

        // Event listeners
        $('#reserve-button').on('click', handleReservation);
        $('#back-button').on('click', showAreaMap);

        mobileBreakpoint.addListener(handleScreenChange);
    }

    // Select a movie and generate its seat map
    function selectMovie(movieId) {
        currentMovie = movieId;
        selectedSeats = [];

        // Update active movie card
        $('.movie-card').removeClass('active');
        $(`.movie-card[data-movie-id="${movieId}"]`).addClass('active');

        // Update movie info
        const movie = movies[movieId];
        $('#current-movie-info').text(`Now Showing: ${movie.title} - ${movie.time}`);

        // Generate seat map for this movie
        seatMap = generateSeatMap(movieId);

        // Update display based on screen size
        handleScreenChange(mobileBreakpoint);
    }

    // Handle screen size changes
    function handleScreenChange(mq) {
        if (!currentMovie) {
            showEmptyState();
            return;
        }

        if (mq.matches) {
            // Mobile view - show area map
            currentView = 'areas';
            showAreaMap();
        } else {
            // Desktop view - show full seat map
            currentView = 'full';
            showFullSeatMap();
        }
    }

    // Show empty state when no movie is selected
    function showEmptyState() {
        const container = $('#seat-map-container');
        container.empty();

        const emptyMessage = $(`
            <div style="text-align: center; padding: 60px 20px; color: #bdc3c7;">
                <div style="font-size: 4rem; margin-bottom: 20px;">🎬</div>
                <h2 style="font-size: 1.5rem; margin-bottom: 10px;">Select a Movie</h2>
                <p>Choose a movie from the list to view available seats</p>
            </div>
        `);

        container.append(emptyMessage);
        $('#reserve-button').hide();
        $('#back-button').hide();
    }

    // Render full seat map for desktop
    function showFullSeatMap() {
        currentView = 'full';
        currentArea = null;

        const container = $('#seat-map-container');
        container.empty();

        const seatGrid = $('<div class="seat-grid"></div>');

        seatMap.forEach(rowData => {
            const rowElement = $('<div class="seat-row"></div>');
            const rowLabel = $(`<div class="row-label">${rowData.row}</div>`);
            rowElement.append(rowLabel);

            rowData.seats.forEach(seat => {
                const seatElement = $(`
                    <div class="seat ${seat.status}" data-seat-id="${seat.id}">
                        ${seat.number}
                    </div>
                `);

                if (seat.status === 'available') {
                    seatElement.on('click', () => toggleSeatSelection(seat.id));
                }

                // Mark as selected if already in selection
                if (selectedSeats.includes(seat.id)) {
                    seatElement.removeClass('available').addClass('selected');
                }

                rowElement.append(seatElement);
            });

            seatGrid.append(rowElement);
        });

        container.append(seatGrid);

        // Show/hide buttons
        $('#back-button').hide();
        updateReserveButton();
    }

    // Render area map for mobile
    function showAreaMap() {
        currentView = 'areas';
        currentArea = null;
        selectedSeats = [];

        const container = $('#seat-map-container');
        container.empty();

        const areaGrid = $('<div class="area-grid"></div>');

        theaterData.areas.forEach(area => {
            const totalSeats = area.rows.length * area.seatsPerRow;
            const areaSeats = seatMap.filter(row => row.area === area.id)
                .flatMap(row => row.seats);
            const availableSeats = areaSeats.filter(seat => seat.status === 'available').length;

            const areaCard = $(`
                <div class="area-card" data-area-id="${area.id}">
                    <div class="area-name">${area.name}</div>
                    <div class="area-info">
                        Rows ${area.rows[0]} - ${area.rows[area.rows.length - 1]}
                    </div>
                    <div class="area-seats">
                        ${availableSeats} / ${totalSeats} seats available
                    </div>
                </div>
            `);

            areaCard.on('click', () => showAreaDetail(area.id));
            areaGrid.append(areaCard);
        });

        container.append(areaGrid);

        // Hide buttons when viewing areas
        $('#back-button').hide();
        $('#reserve-button').hide();
        updateSelectedSeatsDisplay();
    }

    // Show detail of a specific area
    function showAreaDetail(areaId) {
        currentView = 'area-detail';
        currentArea = areaId;

        const container = $('#seat-map-container');
        container.empty();

        const seatGrid = $('<div class="seat-grid"></div>');

        // Filter seats for this area
        const areaRows = seatMap.filter(row => row.area === areaId);

        areaRows.forEach(rowData => {
            const rowElement = $('<div class="seat-row"></div>');
            const rowLabel = $(`<div class="row-label">${rowData.row}</div>`);
            rowElement.append(rowLabel);

            rowData.seats.forEach(seat => {
                const seatElement = $(`
                    <div class="seat ${seat.status}" data-seat-id="${seat.id}">
                        ${seat.number}
                    </div>
                `);

                if (seat.status === 'available') {
                    seatElement.on('click', () => toggleSeatSelection(seat.id));
                }

                // Mark as selected if already in selection
                if (selectedSeats.includes(seat.id)) {
                    seatElement.removeClass('available').addClass('selected');
                }

                rowElement.append(seatElement);
            });

            seatGrid.append(rowElement);
        });

        container.append(seatGrid);

        // Show back button and reserve button
        $('#back-button').show();
        updateReserveButton();
    }

    // Toggle seat selection
    function toggleSeatSelection(seatId) {
        const seatElement = $(`.seat[data-seat-id="${seatId}"]`);

        if (selectedSeats.includes(seatId)) {
            // Deselect
            selectedSeats = selectedSeats.filter(id => id !== seatId);
            seatElement.removeClass('selected').addClass('available');
        } else {
            // Select
            selectedSeats.push(seatId);
            seatElement.removeClass('available').addClass('selected');
        }

        updateSelectedSeatsDisplay();
        updateReserveButton();
    }

    // Update selected seats display
    function updateSelectedSeatsDisplay() {
        const display = $('#selected-seats-list');

        if (selectedSeats.length === 0) {
            display.text('None');
        } else {
            display.text(selectedSeats.sort().join(', '));
        }
    }

    // Update reserve button state
    function updateReserveButton() {
        const button = $('#reserve-button');

        // Show button only when seats are visible
        if (currentView === 'full' || currentView === 'area-detail') {
            button.show();

            if (selectedSeats.length > 0) {
                button.prop('disabled', false);
            } else {
                button.prop('disabled', true);
            }
        } else {
            button.hide();
        }
    }

    // Handle reservation
    function handleReservation() {
        if (selectedSeats.length === 0) return;

        // Simulate sending data to server
        const movie = movies[currentMovie];
        const bookingData = {
            movie: {
                id: currentMovie,
                title: movie.title,
                time: movie.time
            },
            seats: selectedSeats.map(seatId => {
                const seat = seatMap
                    .flatMap(row => row.seats)
                    .find(s => s.id === seatId);
                return {
                    id: seatId,
                    row: seat.row,
                    number: seat.number
                };
            }),
            timestamp: new Date().toISOString()
        };

        console.log('Booking data sent to server:', bookingData);

        // Display confirmation
        const confirmedSeatsText = selectedSeats.sort().join(', ');
        $('#confirmed-seats').text(`${movie.title} - ${movie.time}\nYour seats: ${confirmedSeatsText}`);
        $('#confirmation-message').fadeIn();

        // Update seat statuses to occupied
        selectedSeats.forEach(seatId => {
            const seat = seatMap
                .flatMap(row => row.seats)
                .find(s => s.id === seatId);
            if (seat) {
                seat.status = 'occupied';
            }
        });

        // Reset selection
        selectedSeats = [];

        // Hide confirmation after 5 seconds and refresh view
        setTimeout(() => {
            $('#confirmation-message').fadeOut(() => {
                // Refresh current view
                if (currentView === 'full') {
                    showFullSeatMap();
                } else if (currentView === 'area-detail') {
                    showAreaDetail(currentArea);
                } else {
                    showAreaMap();
                }
            });
        }, 5000);
    }

    // Start the application
    $(document).ready(init);
})();
