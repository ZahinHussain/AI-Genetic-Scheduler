package random

import (
	"crypto/rand"
	"fmt"
	"math/big"
)

func GetSecureRandom(maxValue int) (int, error) {
	if maxValue <= 0 {
		return 0, fmt.Errorf("max value must be positive")
	}

	nBig, err := rand.Int(rand.Reader, big.NewInt(int64(maxValue)))
	if err != nil {
		return 0, fmt.Errorf("failed to generate secure random number: %v", err)
	}
	return int(nBig.Int64()) + 1, nil
}

func GetSecureRandomRange(min, max int) (int, error) {
	if min > max {
		return 0, fmt.Errorf("min cannot be greater than max")
	}

	rangeSize := max - min + 1
	n, err := GetSecureRandom(rangeSize)
	if err != nil {
		return 0, err
	}

	return min + n - 1, nil
}

// GetUniquePair generates two different random numbers between 1 and maxValue
func GetUniquePair(maxValue int) (int, int, error) {
	if maxValue < 2 {
		return 0, 0, fmt.Errorf("max value must be at least 2 to generate unique pairs")
	}

	num1, err := GetSecureRandom(maxValue)
	if err != nil {
		return 0, 0, err
	}

	num2, err := GetSecureRandom(maxValue)
	if err != nil {
		return 0, 0, err
	}

	// Ensure numbers are different
	for num2 == num1 {
		num2, err = GetSecureRandom(maxValue)
		if err != nil {
			return 0, 0, err
		}
	}

	return num1, num2, nil
}
