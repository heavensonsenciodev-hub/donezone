// /dashboard/[id]/TasksBoard.tsx
"use client";

import React, { useEffect } from "react";

interface Task {
  id: string;
  title: string;
  status?: string;
}

export default function TasksBoard({ tasks }: { tasks: Task[] }) {
  useEffect(() => {
    console.log("✅ Tasks from Supabase:", tasks);
  }, [tasks]);

  const handleDragStart = (event: React.DragEvent<HTMLLIElement>) => {
    event.dataTransfer.setData("text/plain", event.currentTarget.id);
  };

  const enableDropping = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const id = event.dataTransfer.getData("text");
    const draggedEl = document.getElementById(id);

    if (draggedEl) {
      event.currentTarget.querySelector("ul")?.appendChild(draggedEl);
      console.log("✅ Moved:", id);
    }
  };

  return (
    <div className="flex justify-center">
      {/* Example: displaying Supabase tasks */}
      <div
        className="w-[330px] h-[500px] border my-5 ml-5 bg-illusion p-4 flex flex-col opacity-70"
        onDragOver={enableDropping}
        onDrop={handleDrop}
      >
        <div className="border-b-2 border-blue-900 mb-3">
          <h1 className="font-extrabold">Tasks</h1>
        </div>

        <div className="flex-1 mt-3 overflow-auto">
          <ul className="space-y-2">
            {tasks.map((task) => (
              <li
                key={task.id}
                id={`task-${task.id}`}
                draggable="true"
                onDragStart={handleDragStart}
                className="w-full h-10 bg-white border rounded-md flex items-center px-3 text-gray-800 text-sm"
              >
                {task.title}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
