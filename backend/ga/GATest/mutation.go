package main

import (
	"GA_2/Tasks"
	"GA_2/utils/random"
	"fmt"
)

const MUTRATE = 150

var hardTasks []Tasks.TaskList
var softTasks []Tasks.TaskList
var hardGene []int

type Individual struct {
	Gene    []int
	Fitness int
}

// Initialize task lists
func init() {
	hardTasks, softTasks = Tasks.TaskInitialise()
	hardGene = Tasks.CreateHardGene()

	fmt.Println()
}

// Well this use a more tradtional approach
func mutationSwap(offspring []Individual) {
	for i := range offspring {
		for x := 0; x < len(offspring[i].Gene); x++ {
			prob, _ := random.GetSecureRandom(100)
			if prob <= MUTRATE {
				swapingGenes(&offspring[i].Gene, x) // Pass entire slice by reference
				break                               // Avoid redundant modifications within the same loop
			}
		}
	}
}

func swapingGenes(offspring *[]int, idx int) {
	randomType := SelectType()
	end := findEndPoint(*offspring)

	if ValidMutation(idx, end, randomType, offspring) {
		for i := 0; i < end; i++ {
			(*offspring)[i] = randomType
		}

	}

}

//if it will overright it will not be done so this called vaidlation mutation ok

func ValidMutation(startIndex int, endIndex int, taskId int, offspring *[]int) bool {

	for i := startIndex; i < endIndex; i++ {
		if (*offspring)[i] == hardGene[i] {
			return false

		}
	}
	return true

}

// keep it 2 hours atm
func findEndPoint(off []int) int {
	if len(off) < 8 {
		return len(off)
	}
	return 8
}

func SelectType() int {
	tempNum, _ := random.GetSecureRandom(4)

	switch tempNum {
	case 1:
		SelectSoft()
	case 2:
		SelectHard()
	}
	return 0
}

func SelectSoft() int {
	soft := softTasks
	if len(soft) == 0 {
		return 0 // Return default task ID if no soft tasks exist
	}

	tempNum, _ := random.GetSecureRandom(len(soft) - 1)
	return soft[tempNum].TaskId
}

func SelectHard() int {
	hard := hardTasks
	if len(hard) == 0 {
		return 0 // Return default task ID if no hard tasks exist
	}

	tempNum, _ := random.GetSecureRandom(len(hard) - 1)
	return hard[tempNum].TaskId
}

func main() {
	// Example: create a population of 2 individuals, each with a gene of length 336 (as in hardGene)
	populationSize := 2
	geneLength := len(hardGene)
	population := make([]Individual, populationSize)

	for i := range population {
		population[i].Gene = make([]int, geneLength)
		copy(population[i].Gene, hardGene) // Start with the hardGene as a base
		population[i].Fitness = 0
	}

	fmt.Println("Before mutation:")
	for i, ind := range population {
		fmt.Printf("Individual %d: %v\n", i, ind.Gene[:16]) // Print first 16 genes for brevity
	}

	mutationSwap(population)

	fmt.Println("\nAfter mutation:")
	for i, ind := range population {
		fmt.Printf("Individual %d: %v\n", i, ind.Gene[:16]) // Print first 16 genes for brevity
	}
}
