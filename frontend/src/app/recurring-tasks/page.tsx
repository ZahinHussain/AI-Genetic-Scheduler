"use client";

import React from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import TaskInputForm from "@/components/form/form-elements/AddRecuringTask";
import TaskList from "@/components/tables/reccuringTask."

// Define the expected structure of task data received from the form
interface TaskFormData {
  time: string;
  day: string;
  taskName: string;
  taskCategory: string;
}

export default function ReccuringTasks() {
  const handleAddTask = (taskData: TaskFormData) => {
    console.log("New Task Submitted:", taskData);
    alert(
      `Task Submitted:\nName: ${taskData.taskName}\nCategory: ${taskData.taskCategory}\nDay: ${taskData.day}\nTime: ${taskData.time}`
    );
  };

  return (
    <div className="min-h-screen bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 px-5 py-7 xl:px-10 xl:py-12 rounded-xs">
      <PageBreadcrumb pageTitle="Tasks" />

      <div className="mt-5">
        {/* Curved card container */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-6">
          <TaskInputForm
            onSubmit={handleAddTask}
            submitButtonText="Reccuring Task"
          />
        </div>

        <div className="mt-6">
          <TaskList />
        </div>
      </div>
    </div>
  );
}
