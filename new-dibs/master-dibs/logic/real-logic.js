var date = new Date().toISOString().slice(0,10);
var day = moment().day();
var rawBookedTimes = [];
var cookedBookTimes = [];
var allRooms = [];
var reservedHours = [];
var intTime = [];
var tableRow = [];
var intervalTimer = 100;
var intervalId;
var moreTime = true;
var stopLoop = false;
console.log(moreTime);

$(document).ready(function() {

    async function processArray(roomID) {
        var roomID = [48, 49, 50, 51, 52, 53, 63];
        
        for (const currentRoomId of roomID) {
            console.log(currentRoomId);    
            checkTimes(currentRoomId);
            await removeDuplicates();
        };
    };
    processArray();
});

function checkTimes(currentRoomId) {

    var apiQuery = "https://chapelhill.evanced.info/dibsAPI/reservations/" + date + "/" + currentRoomId;

    $.ajax({
        url: apiQuery,
        method: "GET"

    }).done(function(response) {
        
        for (var i = 0; i < response.length; i++) {
            rawBookedTimes.push(response[i]);
        };

        for (var j = 0; j < rawBookedTimes.length; j++) {
                        
            var bookedStart = rawBookedTimes[j].StartTime;
            var bookedEnd = rawBookedTimes[j].EndTime;
            var splitBookStart = bookedStart.split("T");
            var splitBookEnd = bookedEnd.split("T");	
            reservedHours.push({
                start: splitBookStart[1],
                end: splitBookEnd[1],
                id: rawBookedTimes[j].RoomID
            });
        };

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
                end: intTimeEnd,
                id: reservedHours[i].id
            });
        };
        
        openTimes(currentRoomId);

        allRooms.forEach(function(openHours) {
            for (var n = 0; n < intTime.length; n++) {
                var start = intTime[n].start;
                var end = intTime[n].end;
                var marker = intTime[n].id;
                var totalTime = end - start;
                for (var p = intTime[n].start; p < intTime[n].end; p += 0.5) {
                    for (var t = 0; t < openHours.slots.length; t++) {
                        if (p === openHours.slots[t].integer && intTime[n].id === openHours.slots[t].id) {
                            openHours.slots[t].available = false;
                        };
                    };      
                };
            };
        });

        if (moreTime === true) {
            for (var g = 0; g <= openHours.slots.length; g++) {
                var counter = g;
                var times = openHours.slots[g].time + " - " + openHours.slots[g + 1].time;
                var timeSlot = "<tbody> <tr class=rowVWade" + " id=" + counter + ">" + "<td class=time>" + times + "</tbody>";
                if (openHours.slots[g].integer < parseFloat(moment().format("HH:mm")) + .5) {
                    var timeSlot = "<p class=past>";
                };
                $("#times").append(timeSlot);
                if (counter >= 21) {
                    moreTime = false;
                };
            };
        };

        if (allRooms.length === 7) {
            allRooms.forEach(async function(openHours, currentRoomId) {
               await writeTimes(openHours, currentRoomId);
            });   
        };
    });
};

function removeDuplicates(rawBookedTimes) {
    let cleanBookedTimes = Array.from(new Set(rawBookedTimes));
    return cleanBookedTimes;
    console.log(cleanBookedTimes);
};

function openTimes(currentRoomId) {
    var open = '';
    var close = '';
    var id = currentRoomId;

    // checks for what day of week/weekend, sets hours of operation accordingly
    if (day === 6 || day === 7) {
        var open = "10:00:00";
        var close = "18:00:00";
    };
    if (day === 5) {
        var open = "9:00:00";
        var close = "18:00:00";
    };
    if  (day <= 4) {
        var open = "9:00:00";
        var close = "20:00:00";
    };
    
    // stores data about times
    openHours = {
        startTime: open,
        endTime: close,
        slots: [],
    };

    console.log(openHours);
    // converts the open and close variables to integer values
    var open = parseFloat(openHours.startTime.split(':')[0], 10);
    var close = parseFloat(openHours.endTime.split(':')[0], 10);

    // loops from open to close by + .5 to simulate 30 minute intervals
    // currentSlot is a string, representing actual time.  Increments with the integer vaules
    while (open <= close) {
    var currentSlot;
        if (Math.floor(open) === open) {
            currentSlot = "" + open + ":00";
        } else {
            var timeSliced = ("" + open).split('.')[0]
            currentSlot = timeSliced + ":30";
        };
        // pushes data gathered from loop into openHours object
            openHours.slots.push({
            time: moment(currentSlot, "HH:mm").format("h:mm"),
            available: true,
            integer: open,
            id: id
        });
        open += 0.5
    };
    allRooms.push(openHours);
    console.log(allRooms);
};

function writeTimes(openHours, currentRoomId) { 
             
    for (var i = 0; i < (openHours.slots.length - 1); i++) {

        var isOpen = openHours.slots[i].available;
        var div = "<div id=" + currentRoomId + ">";
        var rowId = openHours.slots[i].id;
        console.log(isOpen);
        var column = "<tbody class=display>";
        
        // if the room has been booked, gray out link
        if (isOpen === false) {
            var button = "<td id=booked value=" + isOpen + " class=" + rowId + ">" + " Booked";
        };
        // if a room is available, continue as normal 
        if (isOpen === true) {
            var button = "<td id=redirect value=" + isOpen +  " onclick=location.href='http://chapelhill.evanced.info/dibs/?room=" + currentRoomId + "'" + " class=" + rowId + ">" + " Open";
        };
        // if the timeslot is in the past, apply a new class that will result in the link being hidden
        // prevents clutter
        if (openHours.slots[i].integer < parseFloat(moment().format("HH:mm")) + .5) {
            var button = "<button class='past' value=" + isOpen + ">" + " | Booked";
            var timeSlot = "<p class=past>";
            var div = "<div class=past>";
        };
        $(".table1").append($(".48"));
        $(".table2").append($(".49"));
        $(".table3").append($(".50"));
        $(".table4").append($(".51"));
        $(".table5").append($(".52"));
        $(".table6").append($(".53"));
        $(".table7").append($(".63"), button);
        $(".past").hide();
    };
        $(".table1").append($(".48"));
        $(".table2").append($(".49"));
        $(".table3").append($(".50"));
        $(".table4").append($(".51"));
        $(".table5").append($(".52"));
        $(".table6").append($(".53")); 
};
removeDuplicates();
