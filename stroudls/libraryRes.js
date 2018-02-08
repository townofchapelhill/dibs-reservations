// Setting Variables
var currentDate = moment().format('MMMM DD, YYYY HH:mm');
var titleDate = moment().format('MMMM DD, YYYY');
var roomID = 48;
var roomNumber = roomID - 47;
var date = new Date().toISOString().slice(0,10);
console.log(currentDate);
var day = moment().day();
var rawBookedTimes = [];
var cookedBookTimes = [];
var openHours = {};
var reservedHours = [];
var intTime = [];
var interval = [];

// API call
var apiQuery = "https://chapelhill.evanced.info/dibsAPI/reservations/" + date + "/" + roomID;

// Ajax call to be made once document is loaded
$(document).ready(function checkTimes() {
	$.ajax({
		url: apiQuery,
		method: "GET"

	}).done(function(response) {

        // Populating the html with info about date & room #
        $(".title").append("Available room reservations for: " + titleDate);
        $("#room").append('Library room number: ' + roomNumber);
            
        // calls openTimes function to supply buttons
        openTimes();

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
			var intTimeStart = parseFloat(reservedHours[i].start.split(':')[0], 10);
			var intTimeEnd = parseFloat(reservedHours[i].end.split(':')[0], 10);
			intTime.push({
				start: intTimeStart, 
				end: intTimeEnd
			});
		};
		console.log(reservedHours);
		console.log(intTime);

        // IT"S ALIVE!!!
        // This is a bit more hacky of a solution than I wanted
        // but it works now, at least on this document
		for (var n = 0; n < intTime.length; n++) {
			var start = intTime[n].start;
			var end = intTime[n].end;
			var totalTime = end - start;
			// console.log(totalTime);
			for (var p = intTime[n].start; p < intTime[n].end; p += 0.5) {
				console.log(p);
				for (var t = 0; t < openHours.slots.length; t++) {
					if (p === openHours.slots[t].integer) {
						openHours.slots[t].available = false;
					};
				};
			};
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
			
			openHours = {
				startTime: open,
				endTime: close,
				slots: []	
			};

			console.log(openHours.slots);
			var open = parseFloat(openHours.startTime.split(':')[0], 10);
			var close = parseFloat(openHours.endTime.split(':')[0], 10);
			console.log(open);
			console.log(close);

			while (open < close) {
			var currentSlot;
				if (Math.floor(open) === open) {
					currentSlot = "" + open + ":00";
					console.log(currentSlot);
					// blocktime(Math.floor(open));
				} else {
					var timeSliced = ("" + open).split('.')[0]
					currentSlot = timeSliced + ":30"
				};
					openHours.slots.push({
					time: currentSlot,
					available: true,
					integer: open
				});
				open += 0.5
			};

			// loop for adding buttons on the html
			// One day, this will hide buttons that lie between reserved times
			// Also, pay no mind to the formatting, that will be fixed once
			// once the comparison is up and running
			for (var i = 0; i < openHours.slots.length; i++) {
				var times = openHours.slots[i].time;
				var isOpen = openHours.slots[i].available;
                var button = "<button class=reserve a href=http://chapelhill.evanced.info/dibs/?room=" + roomID + " value=" + isOpen + ">" + times;
                if (isOpen === false) {
                    button.attr("class=taken");
                };
				$("#room-times").append(button);
			};
		};
		
	});
});