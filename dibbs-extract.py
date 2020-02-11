"""
A script to extract reservation history via the Dibs API
"""

import requests
import csv
import json
import os
import pathlib
import datetime
import secrets, filename_secrets

# room numbers to be queried
rooms = ["48","49","50","51","52","53","63"]

# Output file and record keys
fieldNames = ['RoomID', 'StartTime', 'EndTime', 'SpaceName', 'Date', 'DayofWeek']
outputFile = pathlib.Path(filename_secrets.productionStaging).joinpath("dibs_history.csv")
csvfile = open(outputFile, 'a')
writer = csv.DictWriter(csvfile, fieldnames=fieldNames)
if os.stat(outputFile).st_size == 0:
    # write the header if the file is empty
    writer.writeheader()

# set start date - append the past week's reservations to the file
query_date = datetime.datetime.now() - datetime.timedelta(weeks= 1)
queryDate = query_date.isoformat().split('T')[0]
day_delta = datetime.timedelta(days=1)
today = datetime.datetime.now().isoformat().split('T')[0]
# URL stub for retrieval
url = "https://chapelhill.evanced.info/dibsAPI/reservations/"

while queryDate <= today:
    # calculate Day of Week
    weekDay= query_date.strftime('%A')
    # iterate on room number
    for room in rooms:
        outputRecord = {}
        dibsURL = url + queryDate + "/" + room
        response = requests.get(dibsURL)
        if response.status_code != 201:
            print(f'Dibs retrieval failed for {dibsURL} with response code:{response.status_code} ')
            #terminate the while loop
            break
        responseObject = json.loads(response.text)
        for row in responseObject:
            row['Date'] = row['StartTime'].split('T')[0]
            row['StartTime'] = row['StartTime'].split('T')[1]
            row['EndTime'] = row['EndTime'].split('T')[1]
            row['DayofWeek'] = weekDay
            writer.writerow(row)
    query_date = query_date + day_delta
    queryDate = query_date.isoformat().split('T')[0]
csvfile.close()