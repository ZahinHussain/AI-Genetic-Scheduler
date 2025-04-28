"use client";

import React from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

import TaskList from "@/components/tables/genTable"

// Define the expected structure of task data received from the form
interface TaskFormData {
  time: string;
  day: string;
  taskName: string;
  taskCategory: string;
}

export default function ManageSchedule() {

  return (
    <div className="min-h-screen bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 px-5 py-7 xl:px-10 xl:py-12 rounded-xs">
      <PageBreadcrumb pageTitle="Tasks" />

      <div className="mt-5">
 

        <div className="mt-6">
          <TaskList />
        </div>
      </div>
    </div>
  );
}
