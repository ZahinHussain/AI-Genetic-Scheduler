package fitnessCalc

/*
import (
	"fmt"
	"strconv"
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
			if temp[index] == 3 || temp[index] >= 6 {
				tempWeight++
			}
		}
		//fmt.Println("temp" + strconv.Itoa(tempWeight))
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
		// Check if temp[i] is 3, 2, or greater than 6
		if temp[i] == 3 || temp[i] > 6 {
			weight++
		}
	}

	// Apply penalty if weight exceeds 192
	if weight > 192 {
		weight = (weight - 192) * 2
		return weight
	}
	return 0
}

func weekendWeight(temp []int) int {
	var weight int
	for i := 240; i < len(temp); i++ {
		if temp[i] >= 6 {
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
		if temp[i] >= 5 {
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
		fmt.Printf("Final session length: %d for task: %d\n", currentLength, currentTask)
	}

	return weight
}

func BreakChecker(temp []int) int {
	var weight int
	var taskFlag bool
	var taskLength int

	for i := 0; i < len(temp); i++ {
		if temp[i] >= 5 {
			taskFlag = true
			taskLength++

		} else if taskFlag {
			taskFlag = false
			if taskLength > 6 {
				//fmt.Println(taskLength)
				weight = weight + (taskLength - 6)
				taskLength = 0
			}
		}
	}
	if taskFlag {
		if taskLength >= 6 {

			weight = weight + (taskLength - 6)
		}

	}
	return weight

}

func calculateSessionWeight(currentLen int) int {
	const (
		MaxNoPenaltyLength = 6
		WeightMultiplier   = 2
	)

	if currentLen > MaxNoPenaltyLength {

		penalty := (currentLen - MaxNoPenaltyLength) * WeightMultiplier
		return penalty
	}

	return 0
}


*/
