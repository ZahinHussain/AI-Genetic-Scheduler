
import React, { useEffect, useState, ChangeEvent } from "react"; // Import ChangeEvent
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
// No Checkbox import needed from ../ui/checkbox
import {
    CalendarIcon,
    ClockIcon,
    LockClosedIcon,
} from "@heroicons/react/24/outline";

// --- Interface and Helper Functions remain the same ---
interface RecurringTask {
  recurring_task_id: number;
  user_id: number;
  start_date: string;
  end_date: string;
  event_start_time: string;
  event_end_time: string;
  category_id: number | null;
  constraint: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
}

const formatTime = (timeString: string): string => {
    const [hours, minutes] = timeString.split(':');
    const hoursNum = parseInt(hours);
    const period = hoursNum >= 12 ? 'PM' : 'AM';
    const hours12 = hoursNum % 12 || 12;
    return `${hours12}:${minutes} ${period}`;
};

const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
};


const constraintTypes: Record<string, { label: string, color: string }> = {
  "hard": { label: "Hard Constraint", color: "error" },
  "soft": { label: "Soft Constraint", color: "success" },
  "": { label: "No Constraints", color: "default" }
};
// Updated constraint types to handle hard and soft constraints





// --- Component Props ---
interface RecurringTasksTableProps {
  selectedTaskIds: number[];
  onSelectionChange: (selectedIds: number[]) => void;
}

export default function RecurringTasksTable({
  selectedTaskIds,
  onSelectionChange,
}: RecurringTasksTableProps) {
  const [recurringTasks, setRecurringTasks] = useState<RecurringTask[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // --- fetchRecurringTasks remains the same ---
   const fetchRecurringTasks = async () => {
       try {
         setLoading(true);
         const token = localStorage.getItem('token');
         const response = await fetch(`/api/recurringtasks`, { // Use relative path
           method: 'GET',
           headers: { 'Authorization': token ? `Bearer ${token}` : '', 'Content-Type': 'application/json' }
         });
         if (!response.ok) { throw new Error(`API Error: ${response.status} - ${await response.text()}`); }
         const data = await response.json();

         let tasks: RecurringTask[] = [];
         // ... (logic to parse data.recurring_tasks or fallback as before) ...
         if (data && Array.isArray(data.recurring_tasks)) {
             tasks = data.recurring_tasks;
         } else if (data && typeof data === 'object' && !Array.isArray(data)) {
             const potentialTasks = Object.values(data).flat();
             if (Array.isArray(potentialTasks) && potentialTasks.length > 0 && 'recurring_task_id' in potentialTasks[0]) {
                 tasks = potentialTasks as RecurringTask[];
             }
         }

         if (tasks.length > 0) {
             setRecurringTasks(tasks);
         } else {
             console.warn("No tasks found or unexpected format, using sample data", data);

         }
       } catch (err) {
         console.error('Failed to fetch recurring tasks:', err);
         setError('Failed to load recurring tasks. Displaying sample data.');

       } finally {
         setLoading(false);
       }
     };


  useEffect(() => {
    fetchRecurringTasks();
  }, []);

  // --- Selection Handlers ---

  // Updated handler for HTML input's onChange event
  const handleSelectAll = (event: ChangeEvent<HTMLInputElement>) => {
    const isChecked = event.target.checked;
    if (isChecked) {
      const allTaskIds = recurringTasks.map((task) => task.recurring_task_id);
      onSelectionChange(allTaskIds);
    } else {
      onSelectionChange([]);
    }
  };

  // Updated handler for HTML input's onChange event
  const handleRowSelect = (taskId: number, event: ChangeEvent<HTMLInputElement>) => {
    const isChecked = event.target.checked;
    if (isChecked) {
      onSelectionChange([...selectedTaskIds, taskId]);
    } else {
      onSelectionChange(selectedTaskIds.filter((id) => id !== taskId));
    }
  };

  // Determine state for the "Select All" checkbox
  const isAllSelected = recurringTasks.length > 0 && selectedTaskIds.length === recurringTasks.length;

  // --- Helper functions getStatusColor, getConstraintInfo remain the same ---

  
 
  const getConstraintInfo = (constraint: string) => {
    // Look up the constraint in our predefined types
    if (constraintTypes[constraint]) {
      return constraintTypes[constraint];
    }
    
    // If it's not in our predefined list, return the raw value with a default color
    return {
      label: constraint || "No Constraints",
      color: "default"
    };
  };


  if (loading) return <div className="p-6 text-center">Loading...</div>;
  if (error && recurringTasks.length === 0) return <div className="p-6 text-center text-red-500">{error}</div>;
  if (!recurringTasks.length) return <div className="p-6 text-center">No recurring tasks found.</div>;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <div className="min-w-[1102px]">
          <Table>
            {/* Table Header */}
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                {/* Added checkbox column */}
                <TableCell
                  isHeader
                  className="px-5 py-3 text-start"
          
                >
                  <label htmlFor="select-all" className="sr-only">Select all tasks</label>
                  <input
                    id="select-all"
                    type="checkbox"
                    className="form-checkbox h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-primary"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  ID & Title
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Description
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Day
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Time
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Constraints
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Category
                </TableCell>
              </TableRow>
            </TableHeader>

            {/* Table Body */}
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {recurringTasks.map((task) => {
                const isSelected = selectedTaskIds.includes(task.recurring_task_id);
                const constraintInfo = getConstraintInfo(task.constraint);
                
                return (
                  <TableRow 
                    key={task.recurring_task_id} 
                    data-state={isSelected ? 'selected' : ''} 
                    className="hover:bg-gray-50 dark:hover:bg-white/[0.02] dark:data-[state=selected]:bg-white/[0.06]"
                  >
                    {/* Checkbox cell */}
                    <TableCell className="px-5 py-4 text-start">
                      <label htmlFor={`select-task-${task.recurring_task_id}`} className="sr-only">{`Select task ${task.title}`}</label>
                      <input
                        id={`select-task-${task.recurring_task_id}`}
                        type="checkbox"
                        className="form-checkbox h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-primary"
                        checked={isSelected}
                        onChange={(e) => handleRowSelect(task.recurring_task_id, e)}
                      />
                    </TableCell>
                    <TableCell className="px-5 py-4 sm:px-6 text-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 overflow-hidden rounded-full bg-primary/10 flex items-center justify-center">
                          <CalendarIcon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                            {task.title}
                          </span>
                          <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                            ID: {task.recurring_task_id}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400 max-w-xs truncate">
                      {task.description || "No description provided"}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center">
                          <Badge
                            size="sm"
                       
                          >
                            {task.start_date}
                          </Badge>
                        </div>
                        {task.end_date && task.end_date !== task.start_date && (
                          <div className="flex items-center mt-1">
                            <Badge
                              size="sm"
                    
                            >
                              {task.end_date}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <ClockIcon className="h-4 w-4 text-gray-400" />
                        <span>
                          {formatTime(task.event_start_time)} - {formatTime(task.event_end_time)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      <LockClosedIcon className="h-4 w-4 text-gray-400" />
                      {task.constraint ? (
                        <Badge
                          size="sm"
                          color={getConstraintInfo(task.constraint).color}
                        >
                          {getConstraintInfo(task.constraint).label}
                        </Badge>
                      ) : (
                        <span className="text-gray-400 text-sm">No constraints</span>
                      )}
                    </div>
                     
                    </TableCell>

                    <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      {task.category_id ? (
                        <Badge size="sm" color="info">
                          Category #{task.category_id}
                        </Badge>
                      ) : (
                        <span className="text-gray-400 text-sm">No category</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
