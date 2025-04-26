package Tasks

type TaskList struct {
	TaskId          int
	TaskTitle       string
	TaskDescription string
	TaskSource      string
	TaskSlots       int
}

// CreateHardList extracts tasks with "hard" constraints from both one-off and recurring tasks
func CreateHardList(oneOffTasks []OneOffTaskGA, recurringTasks []RecurringTaskGA) []TaskList {
	var hardList []TaskList

	// Process one-off tasks with hard constraints
	for _, oneOffTask := range oneOffTasks {
		if oneOffTask.Constraint == "hard" {
			hardList = append(hardList, TaskList{
				TaskId:          oneOffTask.TaskId,
				TaskTitle:       oneOffTask.Description,
				TaskDescription: oneOffTask.Description,
				TaskSource:      "one_off",
				TaskSlots:       oneOffTask.Slots,
			})
		}
	}

	// Process recurring tasks with hard constraints
	for _, recurringTask := range recurringTasks {
		if recurringTask.Constraint == "hard" {
			hardList = append(hardList, TaskList{
				TaskId:          recurringTask.TaskId,
				TaskTitle:       recurringTask.Description,
				TaskDescription: recurringTask.Description,
				TaskSource:      "recurring",
				TaskSlots:       recurringTask.Slots,
			})
		}
	}

	return hardList
}

// CreateSoftList extracts tasks with "soft" constraints from both one-off and recurring tasks
func CreateSoftList(oneOffTasks []OneOffTaskGA, recurringTasks []RecurringTaskGA) []TaskList {
	var softList []TaskList

	// Process one-off tasks with soft constraints
	for _, oneOffTask := range oneOffTasks {
		if oneOffTask.Constraint == "soft" {
			softList = append(softList, TaskList{
				TaskId:          oneOffTask.TaskId,
				TaskTitle:       oneOffTask.Description,
				TaskDescription: oneOffTask.Description,
				TaskSource:      "one_off",
				TaskSlots:       oneOffTask.Slots,
			})
		}
	}

	// Process recurring tasks with soft constraints
	for _, recurringTask := range recurringTasks {
		if recurringTask.Constraint == "soft" {
			softList = append(softList, TaskList{
				TaskId:          recurringTask.TaskId,
				TaskTitle:       recurringTask.Description,
				TaskDescription: recurringTask.Description,
				TaskSource:      "recurring",
				TaskSlots:       recurringTask.Slots,
			})
		}
	}

	return softList
}

// TaskInitializer initializes and returns both hard and soft task lists
func TaskInitialise(recurringTasks []RecurringTaskGA, oneOffTasks []OneOffTaskGA) ([]TaskList, []TaskList, []TaskList) {

	// Create the hard and soft task lists
	hardList := CreateHardList(oneOffTasks, recurringTasks)
	softList := CreateSoftList(oneOffTasks, recurringTasks)
	allTasks := append(hardList, softList...)

	return hardList, softList, allTasks
}
