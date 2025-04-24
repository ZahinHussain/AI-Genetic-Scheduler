package Tasks

import (
	"GA_2/utils/timeUtils"
	"fmt"
)

type RecurringTask struct {
	TaskId      int
	StartDate   int
	EndDate     int
	Slots       int
	Constraint  string
	Title       string
	Description string
}

type RecurringTaskRawDatabase struct {
	TaskId         int
	StartDate      int
	EndDate        int
	EventStartTime string
	EventEndTime   string
	Constraint     string
	Title          string
	Description    string
}

func CreateRecuringScheudle() []RecurringTask {
	var schedule []RecurringTask

	schedule = append(schedule, RecurringTask{1, 2, 2, 4, "hard", "Distributed lecture", "lecture"})
	schedule = append(schedule, RecurringTask{2, 2, 2, 2, "hard", "DSP Meeting", "Meeting with supervisor"})
	schedule = append(schedule, RecurringTask{3, 3, 3, 4, "hard", "AA Practical", "Practical session"})
	schedule = append(schedule, RecurringTask{4, 4, 4, 32, "hard", "Work", "Normal Shift"})
	schedule = append(schedule, RecurringTask{5, 5, 5, 8, "hard", "PSC Practical", "Practical session"})
	schedule = append(schedule, RecurringTask{6, 5, 5, 8, "hard", "DESP Practical", "Practical session"})
	return schedule

}

func CreateHardGene() []int {
	var schedule []RecurringTaskRawDatabase

	schedule = append(schedule, RecurringTaskRawDatabase{1, 1, 1, "11:00", "12:00", "hard", "Distributed lecture", "lecture"})
	schedule = append(schedule, RecurringTaskRawDatabase{2, 1, 1, "12:00", "12:30", "hard", "DSP Meeting", "Meeting with supervisor"})
	schedule = append(schedule, RecurringTaskRawDatabase{3, 2, 2, "09:00", "11:00", "hard", "AA Practical", "Practical session"})
	schedule = append(schedule, RecurringTaskRawDatabase{4, 3, 3, "14:00", "21:00", "hard", "Work", "Normal Shift"})
	schedule = append(schedule, RecurringTaskRawDatabase{5, 4, 4, "09:00", "11:00", "hard", "PSC Practical", "Practical session"})
	schedule = append(schedule, RecurringTaskRawDatabase{6, 4, 4, "15:00", "17:00", "hard", "DESP Practical", "Practical session"})

	var maxDay = GeneratePopulationSleep("21:00", "09:00")
	var dayPad = 84 - maxDay
	var hardGene = make([]int, 336) // Initialize the array with the correct length

	// Create empty schedule
	for x := 0; x < 7; x++ {
		for i := 0; i < dayPad; i++ {
			hardGene[x*48+i] = 0
		}
	}

	for x := range schedule {
		var startSlice, _ = timeUtils.TimeSliceFinder(schedule[x].EventStartTime)
		var endSlice, _ = timeUtils.TimeSliceFinder(schedule[x].EventEndTime)

		fmt.Println(startSlice, endSlice)

		// Calculate the start and end positions in the gene
		startSlice = startSlice - dayPad
		dayPadding := schedule[x].StartDate * 48

		// Calculate duration
		duration, _ := timeUtils.TimeSliceDurationCalc(schedule[x].EventStartTime, schedule[x].EventEndTime)
		end := startSlice + duration + dayPadding

		// Add the task to the gene sequence
		for i := startSlice + dayPadding; i < end; i++ {
			if i >= 0 && i < len(hardGene) {
				hardGene[i] = schedule[x].TaskId
			}
		}
	}

	return hardGene
}

func GeneratePopulationSleep(startBed string, endBed string) int {
	const day = 96
	var padding, _ = timeUtils.TimeSleepDifference(startBed, endBed)
	return day - padding
}
