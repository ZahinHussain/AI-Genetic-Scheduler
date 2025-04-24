package geneToJson

import (
	"GA_2/Tasks"
	"GA_2/utils/timeUtils"
	"time"
)

type Calendar struct {
	ID          int       `json:"id"`
	Title       string    `json:"title"`
	StartDate   time.Time `json:"startDate"`
	EndDate     time.Time `json:"endDate"`
	Description string    `json:"description"`
}

func GeneToList(temp []int, startDay time.Time, loc *time.Location) []Calendar {
	var taskList []Calendar
	allTasks := Tasks.GetAllTasks()

	if len(temp) == 0 {
		return taskList
	}

	currentID := 0
	start := -1

	for i, val := range temp {
		if val != 0 {
			if val != currentID {
				if currentID != 0 {
					// close previous segment
					st, et := timeUtils.TimeSliceToTime(start, i, startDay, loc)
					taskList = append(taskList, Calendar{
						ID:          currentID,
						Title:       allTasks[currentID-1].TaskTitle,
						StartDate:   st,
						EndDate:     et,
						Description: allTasks[currentID-1].TaskDescription,
					})
				}
				currentID = val
				start = i
			}
		} else if currentID != 0 {
			// close current non-zero segment
			st, et := timeUtils.TimeSliceToTime(start, i, startDay, loc)
			taskList = append(taskList, Calendar{
				ID:          currentID,
				Title:       allTasks[currentID-1].TaskTitle,
				StartDate:   st,
				EndDate:     et,
				Description: allTasks[currentID-1].TaskDescription,
			})
			currentID = 0
			start = -1
		}
	}

	// end on last segment
	if currentID != 0 {
		st, et := timeUtils.TimeSliceToTime(start, len(temp), startDay, loc)
		taskList = append(taskList, Calendar{
			ID:          currentID,
			Title:       allTasks[currentID-1].TaskTitle,
			StartDate:   st,
			EndDate:     et,
			Description: allTasks[currentID-1].TaskDescription,
		})
	}

	return taskList
}
