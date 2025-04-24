package CROSS

import (
	"fmt"
	"reflect"
	"testing"
)

func TestArrayInequality(t *testing.T) {
	const arrLen = 336
	arrZero := make([]int, arrLen)
	arrOne := make([]int, arrLen)
	for i := range arrOne {
		arrOne[i] = 1
	}
	var testCrossover []int

	testCrossover = append(testCrossover, arrOne...)
	testCrossover = append(testCrossover, arrZero...)

	fmt.Println("arrZero:", arrZero)
	fmt.Println("arrOne:", arrOne)

	result := Crossover(testCrossover)

	fmt.Println("Crossover:", result)

	if reflect.DeepEqual(result, arrOne) {
		t.Errorf("Expected arrays to be different, but they are equal")
	}
}
