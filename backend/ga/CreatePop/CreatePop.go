package CreatePop

import (
	"GA_2/Tasks"
	"GA_2/utils/random"
	"GA_2/utils/timeUtils"
	"fmt"
)

type Individual struct {
	Gene    []int
	Fitness int
}

func GeneratePopulationSleep(startBed string, endBed string) int {
	const day = 96
	var padding, _ = timeUtils.TimeSleepDifference(startBed, endBed)
	return day - padding
}

type Soft struct {
	TaskID int
	Slots  int
}

type Hard struct {
	TaskID int
	Slots  int
}

var hardList []Hard
var softList []Soft

/*
This will be used to calculate all the hard constraints for reccuring and one of this will make sure it in the 1t standard
*/

func CalculateHardSlots(createRT []Tasks.RecurringTask, createOFT []Tasks.OneOffTask) int {
	var slots = 0
	var hardSlots = 0
	for i := 0; i < len(createRT); i++ {

		if createRT[i].Constraint == "hard" {
			slots += createRT[i].Slots
			hardSlots++
			hardList = append(hardList, Hard{createRT[i].TaskId, createRT[i].Slots})
		}
	}
	for i := 0; i < len(createOFT); i++ {
		if createOFT[i].Constraint == "hard" {
			slots += createOFT[i].Slots
			hardList = append(hardList, Hard{createOFT[i].TaskId, createOFT[i].Slots})
			hardSlots++
		}
	}
	return slots
}

func CalcualteSoftSlots(createRT []Tasks.RecurringTask, createOFT []Tasks.OneOffTask) int {
	var slots = 0
	var softSlots = 0

	for i := 0; i < len(createRT); i++ {

		if createRT[i].Constraint == "soft" {
			slots += createRT[i].Slots
			softSlots++
			softList = append(softList, Soft{createRT[i].TaskId, createRT[i].Slots})
		}
	}
	for i := 0; i < len(createOFT); i++ {

		if createOFT[i].Constraint == "soft" {

			slots += createOFT[i].Slots
			softSlots++
			softList = append(softList, Soft{createOFT[i].TaskId, createOFT[i].Slots})

		}
	}

	return slots
}

func SelectionWheelProb(day int) []int {
	var population []int

	// Prepare fresh lists for each run
	hardList = nil
	softList = nil

	// Calculate slots
	_ = CalculateHardSlots(Tasks.CreateRecuringScheudle(), Tasks.CreateOneOffTask())
	_ = CalcualteSoftSlots(Tasks.CreateRecuringScheudle(), Tasks.CreateOneOffTask())

	// Calculate initial slot counts
	totalHardSlots := 0
	for _, h := range hardList {
		totalHardSlots += h.Slots
	}

	totalSoftSlots := 0
	for _, s := range softList {
		totalSoftSlots += s.Slots
	}

	// Calculate free slots
	freeSlots := day - totalHardSlots - totalSoftSlots
	if freeSlots < 0 {
		freeSlots = 0
	}

	total := day
	for total > 0 {
		// Recalculate current slot counts for proper weighting
		currentHardSlots := 0
		for _, h := range hardList {
			currentHardSlots += h.Slots
		}

		currentSoftSlots := 0
		for _, s := range softList {
			currentSoftSlots += s.Slots
		}

		// Calculate total available slots for weighting
		totalAvailableSlots := currentHardSlots + currentSoftSlots + freeSlots

		// If no slots available, break
		if totalAvailableSlots <= 0 {
			break
		}

		// Generate weighted random selection
		randValue, _ := random.GetSecureRandomRange(1, totalAvailableSlots)

		var taskType int // 1=soft, 2=hard, 3=free
		if randValue <= currentSoftSlots {
			taskType = 1
		} else if randValue <= currentSoftSlots+currentHardSlots {
			taskType = 2
		} else {
			taskType = 3
		}

		length, _ := random.GetSecureRandomRange(2, 4) // Length 2-4

		switch taskType {
		case 1: // soft
			taskID, slots, err := selectSoft(&softList, length)
			if err != nil {
				continue
			}
			for i := 0; i < slots && total > 0; i++ {
				population = append(population, taskID)
				total--
			}
		case 2: // hard
			taskID, slots, err := selectHard(&hardList, length)
			if err != nil {
				continue
			}
			for i := 0; i < slots && total > 0; i++ {
				population = append(population, taskID)
				total--
			}
		case 3: // free
			taskID, slots, err := selectFree(&freeSlots, length)
			if err != nil {
				continue
			}
			for i := 0; i < slots && total > 0; i++ {
				population = append(population, taskID)
				total--
			}
		}
	}
	return population
}

func selectSoft(softTasks *[]Soft, length int) (int, int, error) {
	if len(*softTasks) == 0 {
		return 0, 0, fmt.Errorf("no soft tasks available to select")
	}
	idx, err := random.GetSecureRandom(len(*softTasks))
	if err != nil {
		return 0, 0, err
	}
	idx = idx - 1 // GetSecureRandom returns 1-based index
	task := &(*softTasks)[idx]
	slotsToAssign := length
	if task.Slots < length {
		slotsToAssign = task.Slots
	}
	taskID := task.TaskID
	task.Slots -= slotsToAssign
	if task.Slots == 0 {
		// Remove exhausted task
		*softTasks = append((*softTasks)[:idx], (*softTasks)[idx+1:]...)
	}
	return taskID, slotsToAssign, nil
}

// Select a hard task randomly, assign up to 'length' slots, and update the list
func selectHard(hardTasks *[]Hard, length int) (int, int, error) {
	if len(*hardTasks) == 0 {
		return 0, 0, fmt.Errorf("no hard tasks available to select")
	}
	idx, err := random.GetSecureRandom(len(*hardTasks))
	if err != nil {
		return 0, 0, err
	}
	idx = idx - 1
	task := &(*hardTasks)[idx]
	slotsToAssign := length
	if task.Slots < length {
		slotsToAssign = task.Slots
	}
	taskID := task.TaskID
	task.Slots -= slotsToAssign
	if task.Slots == 0 {
		*hardTasks = append((*hardTasks)[:idx], (*hardTasks)[idx+1:]...)
	}
	return taskID, slotsToAssign, nil
}

func selectFree(freeSlots *int, length int) (int, int, error) {
	if *freeSlots == 0 {
		return 0, 0, fmt.Errorf("no free slots available to select")
	}
	if *freeSlots < length {
		available := *freeSlots
		*freeSlots = 0
		return 0, available, nil
	}
	*freeSlots -= length
	return 0, length, nil
}

// Select a soft task randomly

func CreatePopulation(P int) []Individual {
	// Initialize a slice to hold P individuals
	population := make([]Individual, P)

	for i := 0; i < P; i++ {
		// Calculate available slots for a week (7 days)
		var maxDay = GeneratePopulationSleep("21:00", "09:00")

		// Create an individual with genes for the entire week
		ind := Individual{
			Gene:    SelectionWheelProb(maxDay * 7),
			Fitness: 0,
		}

		// Store the individual in the population array
		population[i] = ind

		fmt.Println(ind)

	}

	return population
}

func main() {
	fmt.Println(Tasks.CreateHardGene())

}
