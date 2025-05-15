package runga

import (
	"api/ga/CreatePop"
	"api/ga/Tasks"
	fitnessCalc "api/ga/fittnessCalc"
	geneToJson "api/ga/jsonConverter"
	"api/ga/utils/random"
	"encoding/json"

	"fmt"
	"os"
	"strings"
	"time"
)

const (
	P       = 50// Population size
	MUTRATE = 5  // Mutation rate
	DAYLEN  = 48

	NUMGEN           = 100
	EliteCount       = 15
	TournementSelect = 8
)

var hardTasks []Tasks.TaskList
var softTasks []Tasks.TaskList
var allTasks []Tasks.TaskList
var OneOffTasks []Tasks.OneOffTask
var hardGene []int
var bestOverall *CreatePop.Individual

// Initialize task lists

func GenerateSchedule(userId int, recurringIDs []int, oneOffIDs []int, dayStart string) []byte {
	fmt.Println("Starting schedule generation...")

	var fetchReccuringTasks []Tasks.RecurringTask
	var fetchOneOffTasks []Tasks.OneOffTask

	fmt.Println("Fetching recurring tasks...")
	fetchReccuringTasks, _ = Tasks.FetchRecurringTasksByIDs(userId, recurringIDs)
	fmt.Printf("Fetched %d recurring tasks\n", len(fetchReccuringTasks))

	fmt.Println("Fetching one-off tasks...")
	fetchOneOffTasks, _ = Tasks.FetchOneOffTaskByDB(userId, oneOffIDs)
	fmt.Printf("Fetched %d one-off tasks\n", len(fetchOneOffTasks))

	fmt.Println("Creating hard gene...")
	hardGene = Tasks.CreateHardGene(fetchReccuringTasks)

	fmt.Println("Initialising tasks...")
	hardTasks, softTasks, allTasks = Tasks.TaskInitialise(
		Tasks.ConvertRecurringTasksToGA(fetchReccuringTasks),
		Tasks.ConvertOneOffTasksToGA(fetchOneOffTasks),
	)
	fmt.Printf("Initialised tasks - hard: %d, soft: %d, total: %d\n", len(hardTasks), len(softTasks), len(allTasks))

	fmt.Println("Creating initial population...")
	var population = CreatePop.CreatePopulation(P,
		Tasks.ConvertRecurringTasksToGA(fetchReccuringTasks),
		Tasks.ConvertOneOffTasksToGA(fetchOneOffTasks),
	)
	fmt.Printf("Population created with %d individuals\n", len(population))

	bestOverall := CreatePop.Individual{Fitness: int(^uint(0) >> 1)} // Max int
	bestGen := make([]CreatePop.Individual, 0)

	fmt.Println("Starting evolutionary loop...")

	fmt.Println(hardTasks)
	for x := 0; x < NUMGEN; x++ {
		fmt.Printf("Generation %d\n", x+1)

		offspring := tournamentSelection(population, P)
		Crossover(offspring)
		mutationSwap(offspring)
		setFitness(offspring)

		for i := range offspring {
			if offspring[i].Fitness < bestOverall.Fitness {
				bestOverall = deepCopyIndividual(offspring[i])
				fmt.Printf("New best fitness: %d (Gen %d, Individual %d)\n", bestOverall.Fitness, x+1, i)
			}
		}

		bestIndividual := recordLowest(offspring)
		bestGen = append(bestGen, bestIndividual)

		population = offspring
	}

	fmt.Println("Evolution complete. Converting best individual to JSON...")
	jsonOutput := GeneToJsonConverter(bestOverall.Gene, dayStart)
	fmt.Println("JSON conversion done.")

	return jsonOutput
}

func writePopulationToFileInd(population []CreatePop.Individual, i int, filename string) error {
	// Open file in append mode (create it if it doesn't exist)
	file, err := os.OpenFile(filename, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		return err
	}
	defer file.Close()

	// Use a strings.Builder to accumulate the output
	var sb strings.Builder
	// Fixed string formatting using fmt.Sprintf
	sb.WriteString(fmt.Sprintf("Gen %d\n", i))

	for _, individual := range population {
		// Append the individual's data followed by a newline
		sb.WriteString(fmt.Sprintf("%v\n", individual.Gene))
	}

	// Append an extra newline to separate generations
	sb.WriteString("\n")

	// Write the accumulated string to the file
	_, err = file.WriteString(sb.String())
	if err != nil {
		return err
	}

	return nil
}

func deepCopyIndividual(ind CreatePop.Individual) CreatePop.Individual {
	newGene := make([]int, len(ind.Gene))
	copy(newGene, ind.Gene)
	return CreatePop.Individual{
		Gene:    newGene,
		Fitness: ind.Fitness,
	}
}

func recordLowest(population []CreatePop.Individual) CreatePop.Individual {
	var lowestFitness = population[0].Fitness
	var bestIndividual CreatePop.Individual

	for _, individual := range population {
		if individual.Fitness < lowestFitness {
			lowestFitness = individual.Fitness
			bestIndividual = individual
		}
	}

	return bestIndividual
}
func tournamentSelection(population []CreatePop.Individual, P int) []CreatePop.Individual {

	offspring := make([]CreatePop.Individual, P)

	for i := 0; i < P; i++ {
		// Select 10 random individuals
		parents := make([]CreatePop.Individual, TournementSelect)
		for j := 0; j < TournementSelect; j++ {
			index, _ := random.GetSecureRandom(len(population) - 1)
			parents[j] = population[index]
		}

		// Find the individual with the smallest fitness
		smallNumber := parents[0]
		for j := 1; j < TournementSelect; j++ {
			if parents[j].Fitness < smallNumber.Fitness {
				smallNumber = parents[j]
			}
		}

		offspring[i] = smallNumber
	}

	return offspring
}

func setFitness(population []CreatePop.Individual) {

	for i := range population {
		weight := fitnessCalc.GetSoftConstraints(population[i].Gene) +
			fitnessCalc.GetHardConstraits(population[i].Gene, hardGene, allTasks, OneOffTasks)

		population[i].Fitness = weight
		//fmt.Println(weight)
	}
}

func Crossover(offspring []CreatePop.Individual) {
	geneLength := len(offspring[0].Gene) // Assuming all genes have the same length

	for i := 0; i+1 < len(offspring); i += 2 { // Process individuals in pairs
		parent1 := &offspring[i] // Use pointers to modify directly
		parent2 := &offspring[i+1]

		// Choose two distinct crossover points
		point1, _ := random.GetSecureRandom(geneLength)
		point2, _ := random.GetSecureRandom(geneLength)

		// Ensure point1 < point2
		if point1 > point2 {
			point1, point2 = point2, point1
		} else if point1 == point2 {
			// If points are the same, shift one (or skip crossover for this pair)
			point2 = (point1 + 1) % geneLength
			if point1 > point2 { // Handle wrap-around case if point1 was last index
				point1, point2 = point2, point1
			}
		}

		// Swap the segment between point1 and point2
		for j := point1; j < point2; j++ {
			parent1.Gene[j], parent2.Gene[j] = parent2.Gene[j], parent1.Gene[j]
		}

		// No need to reassign offspring[i] = parent1 as we modified via pointers
	}
}

/*
Mutation code should work
*/
// Well this use a more tradtional approach
func mutationSwap(offspring []CreatePop.Individual) {
	for i := range offspring {
		for x := 0; x < len(offspring[i].Gene); x++ {
			prob, _ := random.GetSecureRandom(100)
			if prob < MUTRATE {
				swapingGenes(&offspring[i].Gene, x) // Pass entire slice by reference

			}
		}
	}
}

func swapingGenes(offspring *[]int, idx int) {
	randomType := SelectType()

	if ValidMutation(randomType, offspring) {
		(*offspring)[idx] = randomType
	}

}

//if it will overright it will not be done so this called vaidlation mutation ok

func ValidMutation(i int, offspring *[]int) bool {

	if (*offspring)[i] == hardGene[i] {
		return false
	}
	return true
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

func SelectType() int {
	tempNum, _ := random.GetSecureRandom(4)

	switch tempNum {
	case 1:
		return 0
	case 2:
		return SelectSoft()
	case 3:
		return SelectHard()
	}
	return 0
}

func GeneToJsonConverter(temp []int, startDay string) []byte {
	// Load the timezone
	loc, err := time.LoadLocation("Europe/London")
	if err != nil {
		fmt.Println("Error loading location:", err)
		return nil
	}

	// Parse the date string to a time.Time object
	startDate, err := time.Parse("2006-01-02", startDay)
	if err != nil {
		fmt.Println("Error parsing start date:", err)
		return nil
	}

	// If you need to set the timezone for the parsed date
	startDateWithTZ := startDate.In(loc)

	// Now pass the properly parsed date to GeneToList
	// Note: You may need to adjust this call based on what GeneToList actually expects
	calendar := geneToJson.GeneToList(temp, startDateWithTZ, loc, allTasks)

	jsonOutput, err := json.MarshalIndent(calendar, "", "  ")
	if err != nil {
		fmt.Println("Error marshalling to JSON:", err)
		return nil
	}

	return jsonOutput
}
