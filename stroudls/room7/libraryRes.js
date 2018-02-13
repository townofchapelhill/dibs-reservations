// Setting Variables
var currentDate = moment().format('MMMM DD, YYYY HH:mm');
var titleDate = moment().format('MMMM DD, YYYY');
var roomID = 54;
var roomNumber = roomID - 47;
var date = new Date().toISOString().slice(0,10);
var day = moment().day();
var rawBookedTimes = [];
var cookedBookTimes = [];
var openHours = {};
var reservedHours = [];
var intTime = [];
var intervalTimer = 600;
var intervalId;


// API call
var apiQuery = "https://chapelhill.evanced.info/dibsAPI/reservations/" + date + "/" + roomID;

// calls checkTimes function on document load
$(document).ready(function() {
	checkTimes();
});

// Ajax call to be made once document is loaded
function checkTimes() {
	$.ajax({
		url: apiQuery,
		method: "GET"

	}).done(function(response) {

        // Populating the html with info about date & room #
        $(".title").append("Available room reservations for: " + titleDate);
        $("#room").append('Library room number: ' + roomNumber);
            
        // calls openTimes function to supply buttons
		openTimes();
		
		// Decreases intervalTimer by 1 every second
		intervalId = setInterval(reloadTimes, 1000);
		
		// getting the booked times out of the json object
        for (var i = 0; i < response.length; i++) {
            rawBookedTimes.push(response[i]);
        };

        // further isolating the time data. 
        // storing data in reserved hours array
        for (var j = 0; j < rawBookedTimes.length; j++) {
                        
            var bookedStart = rawBookedTimes[j].StartTime;
            var bookedEnd = rawBookedTimes[j].EndTime;
            var splitBookStart = bookedStart.split("T");
            var splitBookEnd = bookedEnd.split("T");	
            reservedHours.push({
                start: splitBookStart[1],
                end: splitBookEnd[1]
            });
        };

		// converting reserved times into integer values to compare in openHours function
		for (var i = 0; i < reservedHours.length; i++) {
			var intTimeStart = parseFloat(reservedHours[i].start.split(':')[0]);
			var intTimeEnd = parseFloat(reservedHours[i].end.split(':')[0]);
			// if the string contains a 30:00, then add .5 to the integer value
			// improves accuracy of comparison
			if (reservedHours[i].start.substring(3) === "30:00") {
				intTimeStart += .5;
			};
			if (reservedHours[i].end.substring(3) === "30:00") {
				intTimeEnd += .5;
			};
			intTime.push({
				start: intTimeStart, 
				end: intTimeEnd
			});
		};

		// sots intTime array in ascending order to assist later comparison
		intTime.sort(function(a, b){return a.start - b.start});

		// Compares integers from the intTime array against the integer values stored in openHours.slots.integer
		// If the values match, it sets the respective openHours.slots.available value to false
		for (var n = 0; n < intTime.length; n++) {
			var start = intTime[n].start;
			var end = intTime[n].end;
			var totalTime = end - start;
			for (var p = intTime[n].start; p < intTime[n].end; p += 0.5) {
				for (var t = 0; t < openHours.slots.length; t++) {
					if (p === openHours.slots[t].integer) {
						openHours.slots[t].available = false;
					};
				};
			};
        };

        // loop for adding buttons on the html
        // reserved slots do not have a link attached to them
        // so users cannot attempt to book rooms that are already booked
        for (var i = 0; i < openHours.slots.length; i++) {
            var times = openHours.slots[i].time;
			var isOpen = openHours.slots[i].available;
			if (openHours.slots[i].available === false) {
                var button = "<p class='booked' value=" + isOpen + ">" + times + " | Booked";
                $(".booked").css("background-color", "#d6d6d6");
            	$(".container").css("background-color", "#d6d6d6");
			}; 
			if (openHours.slots[i].available === true) {
				var button = "<p class=redirect value=" + isOpen +  " onclick=location.href='http://chapelhill.evanced.info/dibs/?room=" + roomID + "'" + ">" + times  + " | Open";
			};
			$(".table").append(button);
        };
        
		// Depending on the day, sets the hours the library is open.  
		// Loops through, creating a boolean value to help with comparison & DOM manipulation  
		function openTimes() {
			var open = '';
			var close = '';

			if (day === 6 || day === 7) {
				var open = "10:00:00";
				var close = "18:00:00";
			}
			if (day === 5) {
				var open = "9:00:00";
				var close = "18:00:00";
			} else {
				var open = "9:00:00";
				var close = "20:00:00";
			};
            
            // stores data about times
			openHours = {
				startTime: open,
				endTime: close,
				slots: []	
			};

            // converts the open and close variables to integer values
			var open = parseFloat(openHours.startTime.split(':')[0], 10);
			var close = parseFloat(openHours.endTime.split(':')[0], 10);

            // loops from open to close by + .5 to simulate 30 minute intervals
            // currentSlot is a string, representing actual time.  Increments with the integer vaules
            while (open < close) {
			var currentSlot;
				if (Math.floor(open) === open) {
					currentSlot = "" + open + ":00";
				} else {
					var timeSliced = ("" + open).split('.')[0]
					currentSlot = timeSliced + ":30"
                };
                // pushes data gathered from loop into openHours object
					openHours.slots.push({
					time: moment(currentSlot, "HH:mm").format("h:mm"),
					available: true,
					integer: open
				});
				open += 0.5
			};
		};		
    });
};

// timer function that calls the main function every 10 minutes
// meant to ensure that the displayed available/booked times are still accurate
function reloadTimes() {
	intervalTimer--;
	if (intervalTimer === 0) {
		$(".table").empty();
		checkTimes();
		intervalTimer = 600;
	};
};
