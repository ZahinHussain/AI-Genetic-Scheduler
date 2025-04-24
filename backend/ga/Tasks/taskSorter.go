package Tasks

type TaskList struct {
	TaskId          int
	TaskTitle       string
	TaskDescription string
	TaskSlots       int
}

// CreateHardList extracts tasks with "hard" constraints from both one-off and recurring tasks
func CreateHardList(oneOffTasks []OneOffTask, recurringTasks []RecurringTask) []TaskList {
	var hardList []TaskList

	// Process one-off tasks with hard constraints
	for _, oneOffTask := range oneOffTasks {
		if oneOffTask.Constraint == "hard" {
			hardList = append(hardList, TaskList{
				TaskId:          oneOffTask.TaskId,
				TaskTitle:       oneOffTask.Description,
				TaskDescription: oneOffTask.Description,
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
				TaskSlots:       recurringTask.Slots,
			})
		}
	}

	return hardList
}

// CreateSoftList extracts tasks with "soft" constraints from both one-off and recurring tasks
func CreateSoftList(oneOffTasks []OneOffTask, recurringTasks []RecurringTask) []TaskList {
	var softList []TaskList

	// Process one-off tasks with soft constraints
	for _, oneOffTask := range oneOffTasks {
		if oneOffTask.Constraint == "soft" {
			softList = append(softList, TaskList{
				TaskId:          oneOffTask.TaskId,
				TaskTitle:       oneOffTask.Description,
				TaskDescription: oneOffTask.Description,
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
				TaskSlots:       recurringTask.Slots,
			})
		}
	}

	return softList
}

// TaskInitializer initializes and returns both hard and soft task lists
func TaskInitialise() ([]TaskList, []TaskList) {
	// Get the predefined tasks from the task creation functions
	oneOffTasks := CreateOneOffTask()
	recurringTasks := CreateRecuringScheudle()

	// Create the hard and soft task lists
	hardList := CreateHardList(oneOffTasks, recurringTasks)
	softList := CreateSoftList(oneOffTasks, recurringTasks)

	return hardList, softList
}

func GetAllTasks() []TaskList {
	hardList, softList := TaskInitialise()

	// Combine both lists
	allTasks := append(hardList, softList...)

	return allTasks
}
