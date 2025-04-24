package timeUtils

import (
	"testing"
	"time"
)

func TestTime(t *testing.T) {
	tests := []struct {
		startTime string
		endTime   string
		expected  int
	}{
		{"16:00", "17:15", 5},
		{"09:00", "10:00", 4},
		{"12:30", "14:00", 6},
	}

	for _, tt := range tests {
		result, err := TimeSliceDurationCalc(tt.startTime, tt.endTime)
		if err != nil {
			t.Errorf("Error calculating time slice duration: %v", err)
		}
		if result != tt.expected {
			t.Errorf("Time slice duration = %d; want %d", result, tt.expected)
		}
	}
}

func TestTimeDifference(t *testing.T) {
	tests := []struct {
		startTime string
		endTime   string
		expected  int
	}{
		{"22:00", "09:00", 44},
		{"22:00", "08:30", 42},
	}

	for _, tt := range tests {
		result, err := TimeSleepDifference(tt.startTime, tt.endTime)
		if err != nil {
			t.Errorf("Error calculating time slice duration: %v", err)
		}
		if result != tt.expected {
			t.Errorf("Time slice duration = %d; want %d", result, tt.expected)
		}
	}
}

func TestTimeSliceToTime(t *testing.T) {
	baseDay := time.Date(2025, 4, 20, 0, 0, 0, 0, time.UTC)

	tests := []struct {
		name       string // Added a name for clarity
		startSlice int
		endSlice   int
		startDay   time.Time
		expStart   time.Time
		expEnd     time.Time
		// Add a description if the logic isn't obvious
		description string
	}{
		{
			name:        "Case 1: Mid-day interval",
			startSlice:  8,
			endSlice:    10, // Assuming this defines an interval related to slice 8
			startDay:    baseDay,
			expStart:    time.Date(2025, 4, 20, 11, 0, 0, 0, time.UTC),  // 11:00
			expEnd:      time.Date(2025, 4, 20, 11, 30, 0, 0, time.UTC), // 11:30 (Suggests 30 min duration)
			description: "Slice 8 corresponds to 11:00, interval is 30 mins.",
		},
	}

	for _, tt := range tests {
		// Use t.Run to get separate reporting for each test case
		t.Run(tt.name, func(t *testing.T) {
			gotStart, gotEnd := TimeSliceToTime(tt.startSlice, tt.endSlice, tt.startDay, time.UTC)

			// Check start time
			if !gotStart.Equal(tt.expStart) {
				t.Errorf(
					"TimeSliceToTime(%d, %d, %v) START mismatch:\ngot:  %v\nwant: %v (%s)",
					tt.startSlice, tt.endSlice, tt.startDay.Format(time.RFC3339),
					gotStart.Format(time.RFC3339), tt.expStart.Format(time.RFC3339), tt.description,
				)
			}

			// Check end time
			if !gotEnd.Equal(tt.expEnd) {
				t.Errorf(
					"TimeSliceToTime(%d, %d, %v) END mismatch:\ngot:  %v\nwant: %v (%s)",
					tt.startSlice, tt.endSlice, tt.startDay.Format(time.RFC3339),
					gotEnd.Format(time.RFC3339), tt.expEnd.Format(time.RFC3339), tt.description,
				)
			}
		})
	}
}
