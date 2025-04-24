package timeUtils

import (
	"strconv"
	"time"
)

// TimeSliceDurationCalc calculates the duration in time slices between two times.
func TimeSliceDurationCalc(startTime string, endTime string) (int, error) {
	// Parse start time

	var startTimeSlot, _ = TimeSliceFinder(startTime)

	var endTimeSlot, _ = TimeSliceFinder(endTime)

	timeDuration := endTimeSlot - startTimeSlot
	return timeDuration, nil
}

func TimeSleepDifference(startTime string, endTime string) (int, error) {
	//padding
	const day = 96
	var startTimeSlot, _ = TimeSliceFinder(startTime)

	var endTimeSlot, _ = TimeSliceFinder(endTime)

	return day - (startTimeSlot - endTimeSlot), nil
}

func TimeDifference(startTime string, endTime string) int {
	var startTimeSlot, _ = TimeSliceFinder(startTime)
	var endTimeSlot, _ = TimeSliceFinder(endTime)

	return endTimeSlot - startTimeSlot
}

func TimeSliceToTime(startSlice, endSlice int, startDay time.Time, loc *time.Location) (time.Time, time.Time) {
	const Day = 48
	const TimeBuffer = 36

	y, m, d := startDay.Date()

	dayFind := startSlice / Day // This will be 0 since startSlice is 8

	convertedStartSlice := startSlice%Day + TimeBuffer
	convertedEndSlice := endSlice%Day + TimeBuffer

	startHour := convertedStartSlice / 4
	startMin := (convertedStartSlice % 4) * 15 // Assuming each slice represents 15 minutes

	endHour := convertedEndSlice / 4
	endMin := (convertedEndSlice % 4) * 15 // Assuming each slice represents 15 minutes

	StartDate := time.Date(y, m, d, startHour, startMin, 0, 0, loc)
	EndDate := time.Date(y, m, d, endHour, endMin, 0, 0, loc)

	startDay = StartDate.AddDate(0, 0, dayFind)
	endDay := EndDate.AddDate(0, 0, dayFind)

	if endSlice < startSlice {
		endDay = endDay.AddDate(0, 0, 1)
	}

	return startDay, endDay
}

// TimeSliceFinder converts a time string to a time slice.
// need to substraction for full day
func TimeSliceFinder(time string) (int, error) {
	// Extract hours and minutes from input string
	timeHours, err := strconv.Atoi(time[:2])
	if err != nil {
		return 0, err
	}

	timeMins, err := strconv.Atoi(time[3:5])
	if err != nil {
		return 0, err
	}

	// Calculate time slice
	timeSlice := (timeHours)*4 + (timeMins / 15)
	return timeSlice, nil
}
