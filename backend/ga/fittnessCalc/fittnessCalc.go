package fitnessCalc

import (
	"GA_2/Tasks"
	"fmt"

	_ "strconv"
)

type taskTimes struct {
	taskName   int
	taskLength int
	startSlot  int
	endSlot    int
}

var Gene []int

type TaskSlots struct {
	startSlot  int
	endSlot    int
	taskLength int
}

type NestTaskSlot struct {
	data map[int]map[int]TaskSlots
}

const GENLEN = 336
const MissTaskPen = 100000

// Cheeks indvidule days to see if under 12 hours a day then there will be a weight applied
func DayCheek(temp []int) int {
	var weight int
	const daysInWeek = 7
	const slotsPerDay = 48
	const maxTempWeight = 40
	//fmt.Println(len(temp))
	for i := 0; i < daysInWeek; i++ {
		var tempWeight int
		for j := 0; j < slotsPerDay; j++ {
			index := i*slotsPerDay + j
			if temp[index] != 0 {
				tempWeight++
			}
		}

		if tempWeight >= maxTempWeight { // Changed to strictly less than

			weight = (tempWeight - maxTempWeight) + weight
		}
	}

	//fmt.Println("Total Weight:", weight)
	return weight
}

// Ensure tasks no single tasks are minnmised
func SingleTask(temp []int) int {
	var weight int
	for i := 0; i < len(temp)-2; i++ {

		if temp[i] != temp[i+1] && temp[i+1] != temp[i+2] && temp[i+1] != 0 {
			weight++
			//fmt.Println(temp[i : i+3])
		}

	}
	return (weight * 3)

}

// that fall within the range [3, 6). If the weight exceeds 192, it applies a penalty.
func workCommitment(temp []int) int {
	var weight int
	for i := 0; i < len(temp); i++ {

		if temp[i] != 0 {
			weight++
		}
	}

	if weight > 192 {
		weight = (weight - 192) * 2
		return weight
	}
	return 0
}

func weekendWeight(temp []int) int {
	var weight int
	for i := 240; i < len(temp); i++ {
		if temp[i] != 0 {
			weight++
		}
	}
	weight = weight * 4

	return weight
}

func SessionLengthTaskFinder(temp []int) int {
	var currentLength int
	var currentTask int
	var inSession bool
	var startIndex int
	var endIndex int
	var weight int
	var schedule []taskTimes

	for i := 0; i < len(temp); i++ {
		if temp[i] != 0 {
			if !inSession {
				// Starting a new session
				currentTask = temp[i]
				startIndex = i
				currentLength = 1
				inSession = true
			} else if currentTask == temp[i] {

				currentLength++

			} else {
				// Different task value, end current session
				endIndex = i
				//	fmt.Printf("Session ended with length: %d for task: %d (from %d to %d)\n",
				//	currentLength, currentTask, startIndex, endIndex)
				schedule = append(schedule, taskTimes{taskName: currentTask, taskLength: currentLength, startSlot: startIndex, endSlot: endIndex})
				currentTask = temp[i]
				currentLength = 1
				startIndex = i
			}
		} else {
			// Value <= 5, end any current session
			if inSession {
				endIndex = i
				weight += calculateSessionWeight(currentLength)
				schedule = append(schedule, taskTimes{taskName: currentTask, taskLength: currentLength, startSlot: startIndex, endSlot: endIndex})
				//	fmt.Printf("Session ended with length: %d for task: %d (from %d to %d)\n",
				//	currentLength, currentTask, startIndex, endIndex)
				inSession = false
				currentLength = 0
				currentTask = 0
			}
		}
	}

	// Handle any ongoing session at the end
	if inSession {
		weight += calculateSessionWeight(currentLength)
		//fmt.Printf("Final session length: %d for task: %d\n", currentLength, currentTask)
	}

	return weight
}

func calculateSessionWeight(currentLen int) int {
	const (
		MaxNoPenaltyLength = 8
		WeightMultiplier   = 2
	)

	if currentLen > MaxNoPenaltyLength {

		penalty := (currentLen - MaxNoPenaltyLength) * WeightMultiplier
		return penalty
	}

	return 0
}

func BreakChecker(temp []int) int {
	var weight int
	var taskFlag bool
	var taskLength int

	for i := 0; i < len(temp); i++ {
		if temp[i] != 0 {
			taskFlag = true
			taskLength++

		} else if taskFlag {
			taskLength--
			taskFlag = false
			if taskLength > 8 {
				weight = weight + (taskLength - 8)
				taskLength = 0
			}
		}
	}
	if taskFlag {
		if taskLength >= 8 {

			weight = weight + (taskLength - 8)
		}

	}
	return weight

}

func GetSoftConstraints(chromo []int) int {
	var softWeight int

	// Calculate and add work commitment weight
	workCommitmentWeight := workCommitment(chromo)
	//fmt.Println("Work Commitment Weight: " + strconv.Itoa(workCommitmentWeight))
	softWeight += workCommitmentWeight

	// Calculate and add weekend weight
	weekendWeightValue := weekendWeight(chromo)
	//fmt.Println("Weekend Weight: " + strconv.Itoa(weekendWeightValue))
	softWeight += weekendWeightValue

	// Calculate and add session length weight
	sessionLengthWeight := SessionLengthTaskFinder(chromo)
	//	fmt.Println("Session Length Task Finder Weight: " + strconv.Itoa(sessionLengthWeight))
	softWeight += sessionLengthWeight

	// Calculate and add day check weight
	sessionDay := DayCheek(chromo)
	//fmt.Println("Day cheek: " + strconv.Itoa(sessionDay))
	softWeight += sessionDay

	// Calculate and add break task weight
	breakTask := BreakChecker(chromo)
	//fmt.Println("Break Task: " + strconv.Itoa(breakTask))
	softWeight += breakTask

	// Calculate and add single task weight
	singleTaskWeight := SingleTask(chromo)
	//fmt.Println("Single Task: " + strconv.Itoa(singleTaskWeight))
	softWeight += singleTaskWeight

	// Print and return the total soft constraints weight
	//fmt.Println("Total Soft Constraints Weight: " + strconv.Itoa(softWeight))
	return softWeight
}

// make sure no missing task are there

func HardConstraits(hard []int, temp []int) int {
	var weight int
	// Create maps for fast lookups
	hardBuffer := make(map[int]bool, GENLEN) // Preallocate space

	// Initialize maps (hardcoded for efficiency)
	for i := 1; i <= GENLEN; i++ {
		hardBuffer[i] = false

	}

	// Check schedule constraints
	for i := 0; i < GENLEN; i++ {
		// Only process positions that have hard constraints
		if hard[i] != 0 {
			// First try to find the task at the exact position
			if temp[i] == hard[i] {
				// Task is already at the correct position
				hardBuffer[i] = true
				continue
			}

			// If not at exact position, prioritize finding it in lower positions first
			var tempIndex = lowerConstraints(i, hard[i], temp, hardBuffer)
			if tempIndex != -1 {
				hardBuffer[tempIndex] = true
				weight += hardWeightCalc(i, tempIndex)
				continue
			}

			// If not found in lower positions, check upper positions
			tempIndex = upperConstraints(i, hard[i], temp, hardBuffer)
			if tempIndex != -1 {
				hardBuffer[tempIndex] = true
				weight += hardWeightCalc(i, tempIndex)
				continue
			}

		}
	}

	return weight
}

// lowerConstraints searches for the specified task in positions below the current index
// Returns the closest position where the task is found, or -1 if not found
func lowerConstraints(currentIndex int, taskID int, schedule []int, visited map[int]bool) int {
	// Start from current position and move downward
	for i := currentIndex; i >= 0; i-- {
		// Check if this position has the task we're looking for and hasn't been visited
		if schedule[i] == taskID && !visited[i] {
			return i
		}
	}
	return -1 // Task not found in lower positions
}

// upperConstraints searches for the specified task in positions above the current index
// Returns the closest position where the task is found, or -1 if not found
func upperConstraints(currentIndex int, taskID int, schedule []int, visited map[int]bool) int {
	// Start from current position and move upward
	for i := currentIndex; i < len(schedule); i++ {
		// Check if this position has the task we're looking for and hasn't been visited
		if schedule[i] == taskID && !visited[i] {
			return i
		}
	}
	return -1 // Task not found in upper positions
}

// hardWeightCalc calculates the penalty weight based on the distance between
// the expected position and the actual position of a hard constraint
func hardWeightCalc(expectedPos int, actualPos int) int {
	distance := abs(expectedPos - actualPos)

	// Time breakdown (1 slot = 15 mins, so 4 slots = 1 hour, 48 slots = 1 day)
	dayDiff := distance / 48
	hourDiff := (distance % 48) / 4
	slotRemainder := distance % 4

	// Weighted penalty (you can tweak the weights as needed)
	penalty := (dayDiff * 24) + (hourDiff * 4) + slotRemainder*2

	return penalty
}

func SoftTasksValid(chromo []int, allTasks []Tasks.TaskList) int {
	var weight int
	scheduleTracker := make(map[int]int)

	// Initialize the map with all soft task IDs
	for _, task := range allTasks {
		scheduleTracker[task.TaskId] = 0
	}

	// Count occurrences of each task in the chromosome
	for _, taskID := range chromo {
		if _, ok := scheduleTracker[taskID]; ok {
			scheduleTracker[taskID]++
		}
	}

	// Calculate weight based on difference between expected and actual counts
	for _, task := range allTasks {
		taskID := task.TaskId
		expectedCount := task.TaskSlots
		actualCount := scheduleTracker[taskID]
		difference := actualCount - expectedCount

		// Apply penalty based on the absolute difference
		if difference > 0 {
			weight += difference * MissTaskPen // Penalty for having too many slots
		} else if difference < 0 {
			weight += (-difference) * MissTaskPen // Penalty for having too few slots
		}

		fmt.Printf("Task ID: %d, Expected: %d, Actual: %d, Difference: %d, Weight Contribution: %d\n",
			taskID, expectedCount, actualCount, difference, abs(difference))
	}

	fmt.Printf("Total weight from SoftScheduleValid: %d\n", weight)

	return weight
}

// Helper function to get absolute value
func abs(x int) int {
	if x < 0 {
		return -x
	}
	return x
}

func DeadLineChecker(chromo []int, oneOffTasks []Tasks.OneOffTask) int {
	var weight int

	for i := 0; i < len(oneOffTasks); i++ {
		var deadLineTemp = 0
		for j := oneOffTasks[i].Deadline; j < len(chromo); j++ {
			if chromo[j] == oneOffTasks[i].TaskId {
				deadLineTemp++
			}
		}
		weight += deadLineTemp

	}
	return weight * 2
}

func GetHardConstraits(chromo []int, schedule []int, allTask []Tasks.TaskList, softTask []Tasks.OneOffTask) int {
	var hard int

	hardC := HardConstraits(chromo, schedule)
	//fmt.Println("Hard Constraint Weight Schedule: " + strconv.Itoa(hardC))
	hard = hardC

	softS := SoftTasksValid(chromo, allTask)
	hard += softS
	//fmt.Println("AllTasksValid Validity: " + strconv.Itoa(softS))

	deadline := DeadLineChecker(chromo, softTask)
	hard += deadline
	//fmt.Println("Deadline Validity: " + strconv.Itoa(deadline))

	//	fmt.Println("Total HARD Constraints: ", hard)
	return hard
}
