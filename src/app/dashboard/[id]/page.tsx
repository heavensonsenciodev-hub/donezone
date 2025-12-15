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

import SkeletonArticle from '../../../components/SkeletonArticle';

interface Task {
  id: number;
  title: string;
  status: string;
  uid?: string;
  position?: number; // <-- position used for ordering (lower = higher on UI)
}

export default function DashboardIdPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTasks, setNewTasks] = useState("");
  const [editingTaskContent, setEditingTaskContent] = useState("");
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const tasksPlaceholderCount = 3;
  const GAP = 1000;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setOpen(false)
  }

  useEffect(() => {
    const fetchUserData = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) return;

      setUserId(user.id);

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Error loading profile:", profileError.message);
        return;
      }

      setUserName(profile.username);
    };

    fetchUserData();
  }, []);

  // Fetch tasks ordered by position ascending (top-first)
  useEffect(() => {
    if (!userId) return;
    const getTasks = async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("uid", userId)
        .order("position", { ascending: true }); // <= order by position

      if (error) {
        console.error("❌ Error fetching tasks:", JSON.stringify(error, null, 2));
      } else {
        setTasks(data || []);
        setLoading(false);
      }
    };

    getTasks();
  }, [userId]);

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

  // Add task with a position set to now (so new tasks go to bottom by default)
  const addTask = async () => {
    if (!newTasks.trim() || !userId) return;

    const nowPos = Date.now(); // big integer position
    const { data, error } = await supabase
      .from("tasks")
      .insert([
        {
          title: newTasks,
          status: "new",
          uid: userId,
          position: nowPos,
        },
      ])
      .select();

    if (error) {
      console.error("❌ Error adding task:", JSON.stringify(error, null, 2));
    } else if (data) {
      setTasks((prev) => [...prev, ...data].sort((a,b)=> (a.position ?? 0) - (b.position ?? 0)));
      setNewTasks("");
    }
  };

  const updateTask = async () => {
    if (!editingTaskId || !editingTaskContent.trim()) return;

    const { data, error } = await supabase
      .from("tasks")
      .update({
        title: editingTaskContent
      })
      .eq("id", editingTaskId);

    if (error) console.error(error);

    setTasks((prev) =>
      prev.map((t) =>
        t.id === editingTaskId ? { ...t, title: editingTaskContent } : t
      )
    );

    setOpen(false);
  };

  const deleteTask = async () => {
    if (!editingTaskId) return;

    const { data, error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", editingTaskId)
      .eq("uid", userId)
      .select();

    if (error) {
      console.error("❌ Error deleting task:", error.message);
      return;
    }

    setTasks((prev) => prev.filter((t) => t.id !== editingTaskId));
    setOpen(false);
  }

  // Drag start
  const handleDragStart = (event: React.DragEvent<HTMLDivElement | HTMLLIElement>, id: number) => {
    event.dataTransfer.setData("text/plain", String(id));
    event.dataTransfer.effectAllowed = "move";
  };

  // Keep dropping allowed on column or task
  const enableDropping = (event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  // Helper: reindex positions in a column so there are large gaps (multiples of 1000)
  const reindexColumn = async (status: string) => {
    const columnTasks = tasks
      .filter(t => t.status === status)
      .sort((a,b) => (a.position ?? 0) - (b.position ?? 0));

    // assign positions = i * 1000
    const updates = columnTasks.map((t, i) => ({ id: t.id, position: (i + 1) * 1000 }));
    if (updates.length === 0) return;

    // update one-by-one (could be batched). Here we do a single RPC per task for simplicity
    for (const u of updates) {
      // optimistic local update
      setTasks(prev => prev.map(p => p.id === u.id ? { ...p, position: u.position } : p));
      await supabase.from('tasks').update({ position: u.position }).eq('id', u.id).eq('uid', userId);
    }
  };

  // Drop on column background -> place at top (we'll set position to minPosition - gap)
const handleDropOnColumn = async (
  event: React.DragEvent<HTMLDivElement>,
  newStatus: string
) => {
  event.preventDefault();

  const draggedId = Number(event.dataTransfer.getData("text/plain"));
  if (!draggedId) return;

  const column = tasks
    .filter(t => t.status === newStatus)
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  const newPos = column.length
    ? (column[0].position ?? GAP) - GAP
    : GAP;

  setTasks(prev =>
    prev
      .map(t =>
        t.id === draggedId
          ? { ...t, status: newStatus, position: newPos }
          : t
      )
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
  );

  await supabase
    .from("tasks")
    .update({ status: newStatus, position: newPos })
    .eq("id", draggedId)
    .eq("uid", userId);
};


const handleDropOnTask = async (
  event: React.DragEvent<HTMLDivElement>,
  targetId: number,
  targetStatus: string
) => {
  event.preventDefault();
  event.stopPropagation();

  const draggedId = Number(event.dataTransfer.getData("text/plain"));
  if (!draggedId || draggedId === targetId) return;

  const column = tasks
    .filter(t => t.status === targetStatus)
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  const targetIndex = column.findIndex(t => t.id === targetId);

  const prev = column[targetIndex - 1];
  const next = column[targetIndex + 1];
  const target = column[targetIndex];

  const rect = event.currentTarget.getBoundingClientRect();
  const insertBefore = event.clientY < rect.top + rect.height / 2;

  let newPos: number;

  if (insertBefore) {
    newPos = prev
      ? Math.floor(((prev.position ?? 0) + (target.position ?? GAP)) / 2)
      : (target.position ?? GAP) - GAP;
  } else {
    newPos = next
      ? Math.floor(((target.position ?? GAP) + (next.position ?? GAP * 2)) / 2)
      : (target.position ?? GAP) + GAP;
  }

  // Optimistic UI
  setTasks(prev =>
    prev
      .map(t =>
        t.id === draggedId
          ? { ...t, status: targetStatus, position: newPos }
          : t
      )
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
  );

  await supabase
    .from("tasks")
    .update({ status: targetStatus, position: newPos })
    .eq("id", draggedId)
    .eq("uid", userId);
};


  // Helper to render tasks for a given status (important: sort by position before mapping)
  const renderColumnTasks = (status: string) => {
    return tasks
      .filter((task) => task.status === status)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      .map((task) => (
        <div
          key={task.id}
          data-task-id={task.id}
          draggable
          onDragStart={(e) => handleDragStart(e, task.id)}
          onDragOver={enableDropping}
          onDrop={(e) => handleDropOnTask(e, task.id, task.status)} // drop onto this item
          className="w-full bg-pink-300 border rounded-md px-3 py-2 text-black text-sm flex items-start gap-2"
        >
          <div
            className="prose prose-sm flex-1 min-w-0 break-words"
            dangerouslySetInnerHTML={{ __html: task.title }}
          />
          <div className="space-x-2 flex items-center shrink-0">
            <Dialog>
              <DialogTrigger>
                <h1
                  onClick={() => {
                    setEditingTaskId(task.id);
                    setEditingTaskContent(task.title);
                  }}
                  className="cursor-pointer hover:text-gray-500 material-symbols-outlined !text-[20px]"
                >
                  edit
                </h1>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit your task</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                  <EditorClient
                    value={editingTaskContent}
                    onChange={(content) => setEditingTaskContent(content)}
                  />

                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button">Cancel</Button>
                    </DialogClose>
                    <DialogClose>
                      <Button type="button" onClick={updateTask}>
                        Update
                      </Button>
                    </DialogClose>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger>
                <h1 onClick={() => setEditingTaskId(task.id)} className="cursor-pointer hover:text-red-400 material-symbols-outlined !text-[20px]">delete</h1>
              </DialogTrigger>

              <DialogContent>
                <DialogHeader>
                  Are you sure that you want to delete this task?
                </DialogHeader>

                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button">Nevermind</Button>
                  </DialogClose>
                  <DialogClose>
                    <Button
                      type="button"
                      onClick={deleteTask}
                      className="hover:bg-red-600 hover:text-white"
                    >
                      Delete!
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      ));
  };

  return (
    <div className="">
      <h1 className="ml-[20px] mt-7 text-lg"><span className="font-medium">Welcome <span className="italic font-semibold">{userName} !</span> Here is a simple <span className="italic font-semibold">Kanban Board</span> for you to manage your tasks.</span></h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 p-5 min-h-screen">

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

          <div className="flex-1 mt-3 overflow-auto" onDragOver={enableDropping} onDrop={(e) => handleDropOnColumn(e, "new")}>
            <div className="space-y-2">
              {loading ? (
                <SkeletonArticle count={tasksPlaceholderCount} />
              ) : (
                renderColumnTasks("new")
              )}
            </div>
          </div>

        </div>

        {/* In Progress */}
        <div
          className="rounded-md bg-fantasy p-4 flex flex-col opacity-70 h-[80vh]"
        >
          <div className="border-b-2 border-shipgrey">
            <h1 className="font-extrabold text-yellow-950  text-2xl">In Progress</h1>
            <p className="italic">List of tasks that are in progress.</p>
          </div>

          <div className="flex-1 mt-3 overflow-auto" onDragOver={enableDropping} onDrop={(e) => handleDropOnColumn(e, "in-progress")}>
            <div className="space-y-2">
              {loading ? (
                <SkeletonArticle count={tasksPlaceholderCount} />
              ) : (
                renderColumnTasks("in-progress")
              )}
            </div>
          </div>
        </div>

        {/* Done */}
        <div
          className="rounded-md bg-fantasy p-4 flex flex-col opacity-70 h-[80vh]">
          <div className="border-b-2 border-shipgrey">
            <h1 className="font-extrabold text-green-950  text-2xl">DoneZone</h1>
            <p className="italic">The zone where your tasks was done.</p>
          </div>

          <div className="flex-1 mt-3 overflow-auto" onDragOver={enableDropping} onDrop={(e) => handleDropOnColumn(e, "done")}>
            <div className="space-y-2">
              {loading ? (
                <SkeletonArticle count={tasksPlaceholderCount} />
              ) : (
                renderColumnTasks("done")
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}