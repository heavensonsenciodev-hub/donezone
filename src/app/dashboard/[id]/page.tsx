"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "../../../../utils/supabase/client";
import { useRouter } from "next/navigation";
import EditorClient from "@/components/EditorClient";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"

interface Task {
  id: number;
  title: string;
  status: string;
  uid?: string; // ✅ include uid to represent user who added it
}

function stripParagraphTags(html: string) {
    return html
    .replace(/^<p>/i, "")      // remove starting <p>
    .replace(/<\/p>$/i, "")    // remove ending </p>
    .trim();
}

export default function DashboardIdPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTasks, setNewTasks] = useState("");
  const [isOverDelete, setIsOverDelete] = useState(false);
  const [userId, setUserId] = useState<string | null>(null); // ✅ store logged-in user's UID
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [userName, setUserName] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    console.log("Form Submitted")
    setOpen(false)
  }

  // ✅ Fetch current logged-in user (with debug log)
  // useEffect(() => {
  //   const getUser = async () => {
  //     const {
  //       data: { user },
  //       error,
  //     } = await supabase.auth.getUser();

  //     console.log("🧍 Logged in user:", user); // 👈 Debug log

  //     if (error) console.error("Error fetching user:", error.message);
  //     else if (user) setUserId(user.id);
  //   };

  //   getUser();
  // }, []);
  useEffect(() => {
    const fetchUserData = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) return;

      setUserId(user.id);

      // Fetch the user's profile from the profiles table
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("username")   // Change the column depending on what you named it
        .eq("id", user.id)     // Must match your RLS setup (id = auth.uid)
        .single();

      if (profileError) {
        console.error("Error loading profile:", profileError.message);
        return;
      }

      setUserName(profile.username);  // Store the name
    };

    fetchUserData();
  }, []);

  


  // ✅ Fetch only the current user's tasks
  useEffect(() => {
    if (!userId) return;
    const getTasks = async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("uid", userId); // ✅ only fetch tasks created by this user

      if (error) {
        console.error("❌ Error fetching tasks:", JSON.stringify(error, null, 2));
      } else {
        setTasks(data || []);
        console.log("✅ loaded tasks:", data);
      }
    };

    getTasks();
  }, [userId]); // ✅ re-run when userId is set

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.replace('/login')
        return
      }
      if (mounted) setUserEmail(session.user.email ?? null)
      setLoading(false)
    })()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) router.replace('/login')
      else setUserEmail(session.user.email ?? null)
    })

    return () => {
      subscription?.unsubscribe()
      mounted = false
    }
  }, [router])

  // ✅ Add task with user id
  const addTask = async () => {
    if (!newTasks.trim() || !userId) return;

    const { data, error } = await supabase
      .from("tasks")
      .insert([
        {
          title: newTasks,
          status: "new",
          uid: userId, // ✅ associate task with logged-in user
        },
      ])
      .select();

    if (error) {
      console.error("❌ Error adding task:", JSON.stringify(error, null, 2));
    } else if (data) {
      setTasks((prev) => [...prev, ...data]);
      setNewTasks("");
      console.log("✅ added task:", data);
    }
  };

  // Drag start: store the numeric id under standard mime type
  const handleDragStart = (event: React.DragEvent<HTMLLIElement>, id: number) => {
    event.dataTransfer.setData("text/plain", String(id));
    event.dataTransfer.effectAllowed = "move";
  };

  // Keep dropping allowed
  const enableDropping = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  // Generic drop handler which optimistically updates UI, then updates Supabase
  const handleDropOnColumn = async (
    event: React.DragEvent<HTMLDivElement>,
    newStatus: string
  ) => {
    event.preventDefault();

    const idStr = event.dataTransfer.getData("text/plain");
    if (!idStr) return;

    const idNum = Number(idStr);
    if (Number.isNaN(idNum)) {
      console.warn("Dropped id is not a number:", idStr);
      return;
    }

    const oldTask = tasks.find((t) => t.id === idNum);
    const oldStatus = oldTask?.status ?? null;

    setTasks((prev) =>
      prev.map((t) => (t.id === idNum ? { ...t, status: newStatus } : t))
    );

    const { data, error } = await supabase
      .from("tasks")
      .update({ status: newStatus })
      .eq("id", idNum)
      .eq("uid", userId) // ✅ safety: only update user’s own tasks
      .select();

    if (error) {
      console.error("❌ Error updating status:", JSON.stringify(error, null, 2));
      if (oldStatus !== null) {
        setTasks((prev) =>
          prev.map((t) => (t.id === idNum ? { ...t, status: oldStatus } : t))
        );
      }
      return;
    }

    if (data && data.length > 0) {
      const updated = data[0];
      setTasks((prev) =>
        prev.map((t) => (t.id === updated.id ? { ...t, status: updated.status } : t))
      );
      console.log(`✅ task ${idNum} status updated → ${newStatus}`);
    }
  };

  const handleDropDeleteColumn = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();

    const idStr = event.dataTransfer.getData("text/plain");
    if (!idStr) return;

    const idNum = Number(idStr);
    if (Number.isNaN(idNum)) {
      console.warn("Dropped id is not a number:", idStr);
      return;
    }

    const taskToDelete = tasks.find((t) => t.id === idNum);
    if (!taskToDelete) return;

    setTasks((prev) => prev.filter((t) => t.id !== idNum));

    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", idNum)
      .eq("uid", userId); // ✅ only delete if owned by this user

    if (error) {
      console.error("❌ Error deleting task:", error.message);
      setTasks((prev) => [...prev, taskToDelete]);
      return;
    }

    console.log(`🗑️ Task ${idNum} deleted successfully.`);
  };

return (
<div className="">
  <h1 className="ml-[20px] mt-7 text-lg"><span className="font-medium">Welcome <span className="italic font-semibold">{userName}</span> Here is a simple <span className="italic font-semibold">Kanban Board</span> for you to manage your tasks.</span></h1>
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 p-5 min-h-screen">

    {/* New */}
    <div className="rounded-md bg-fantasy p-4 flex flex-col opacity-70 h-[80vh]">
      <div className="border-b-2 border-shipgrey mb-3">
        <h1 className="font-extrabold text-shipgrey text-2xl">Task List</h1>
        <p className="italic">Write your tasks in this zone.</p>
      </div>

      <div className="flex w-full items-center">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">+</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] md:max-w-[600px] lg:max-w-[900px] lg:max-h-[1000px]">
            <DialogHeader>
              <DialogTitle>Add your tasks</DialogTitle>
              The zone where you start listing your tasks.
            </DialogHeader>
            <form action="" onSubmit={handleSubmit}>
                <EditorClient
                  value={newTasks}
                  onChange={(content: string) => setNewTasks(content)}
                />
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button">
                    Cancel
                  </Button>
                </DialogClose>
                <DialogClose>
                  <Button type="button" onClick={addTask}>Add Task</Button>
                </DialogClose>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="flex-1 mt-3 overflow-auto" onDragOver={enableDropping}>
        <div className="space-y-2">
          {tasks
            .filter((task) => task.status === "new")
            .map((task) => (
              <div
                key={task.id}
                draggable
                onDragStart={(e) => handleDragStart(e, task.id)}
                className="w-full bg-pink-300 border rounded-md px-3 py-2 text-black text-sm break-words"
              >
                <div
                  className="prose prose-sm"
                  dangerouslySetInnerHTML={{ __html: task.title }}
                />
              </div>
            ))}
        </div>
      </div>




      {/* <div className="flex-1 mt-3 overflow-auto" onDragOver={enableDropping}>
        <ul className="space-y-2">
          {tasks
            .filter((task) => task.status === "new")
            .map((task) => (
              <div
                key={task.id}
                draggable
                onDragStart={(e) => handleDragStart(e, task.id)}
                className="w-full min-h-10 bg-pink-300 border rounded-md flex items-center px-3 text-black text-sm break-words"
                dangerouslySetInnerHTML={{ __html: task.title}}
              >
              </div>
            ))}
        </ul>
      </div> */}
      
    </div>

    {/* In Progress */}
    <div
      className="rounded-md bg-fantasy p-4 flex flex-col opacity-70 h-[80vh]"
      onDragOver={enableDropping}
      onDrop={(e) => handleDropOnColumn(e, "in-progress")}
    >
      <div className="border-b-2 border-shipgrey">
        <h1 className="font-extrabold text-yellow-950  text-2xl">In Progress</h1>
        <p className="italic">List of tasks that are in progress.</p>
      </div>

      <div className="flex-1 mt-3 overflow-auto">
        <ul className="space-y-2">
          {tasks
            .filter((task) => task.status === "in-progress")
            .map((task) => (
              <li
              key={task.id}
              draggable
              onDragStart={(e) => handleDragStart(e, task.id)}
              className="w-full min-h-10 bg-pink-300 border rounded-md flex items-center px-3 text-black text-sm"
              >
                {task.title}
              </li>
            ))}
        </ul>
      </div>
    </div>

    {/* Done */}
    <div
      className="rounded-md bg-fantasy p-4 flex flex-col opacity-70 h-[80vh]"
      onDragOver={enableDropping}
      onDrop={(e) => handleDropOnColumn(e, "done")}
    >
      <div className="border-b-2 border-shipgrey">
        <h1 className="font-extrabold text-green-950  text-2xl">DoneZone</h1>
          <p className="italic">The zone where your tasks was done.</p>
      </div>

      <div className="flex-1 mt-3 overflow-auto">
        <ul className="space-y-2">
          {tasks
            .filter((task) => task.status === "done")
            .map((task) => (
              <li
                key={task.id}
                draggable
                onDragStart={(e) => handleDragStart(e, task.id)}
                className="w-full min-h-10 bg-pink-300 border rounded-md flex items-center px-3 text-gray-800 text-sm"
              >
                {task.title}
              </li>
            ))}
        </ul>
      </div>
    </div>

    {/* Delete */}
    <div
      className={`rounded-md p-4 flex flex-col opacity-70 h-[80vh] transition-all duration-300 ${
        isOverDelete ? "bg-red-600 border-red-800 text-white" : "bg-lilac"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsOverDelete(true);
      }}
      onDragLeave={() => setIsOverDelete(false)}
      onDrop={(e) => {
        setIsOverDelete(false);
        handleDropDeleteColumn(e);
      }}
    >
      <div className="border-b-2 border-red-900">
        <h1 className="font-extrabold">Delete</h1>
      </div>

      <div className="flex-1 mt-3 overflow-auto flex flex-col items-center justify-center">
        <span className="material-symbols-outlined text-5xl">delete</span>
        <p className="mt-2 text-sm text-center">Drag a task here to delete</p>
      </div>
    </div>

  </div>
</div>
);


}
