// /app/dashboard/layout.tsx
export const revalidate = 0
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
import { ReactNode } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Image from "next/image";
import { logout } from "./logout-action";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <div className="p-4 bg-fantasy">
          <div className="flex justify-between items-center ">
            <Image src="/logo.png"  alt="logo" width={200} height={50}/>
            {/* <div className="relative w-[700px]">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-black text-[20px]">
                search
              </span>
              <input
                type="text"
                placeholder="Search tasks"
                className="w-full pl-10 pr-3 py-2 rounded-full border border-black focus:outline-none focus:ring-2 focus:ring-blue-400 text-black"
              />
            </div> */}
            <div className="flex gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <span className="flex items-center justify-center w-10 h-10 cursor-pointer">
                  <span className="material-symbols-outlined text-[24px] hover:text-gray-600 transition-colors">
                    notifications
                  </span>
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>My Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <h1>LOL lorem</h1>
                <h1>LOL</h1>
                <h1>LOL</h1>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <span className="flex items-center justify-center w-10 h-10 cursor-pointer">
                  <span className="material-symbols-outlined text-[24px] hover:text-gray-600 transition-colors">
                    person
                  </span>
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>View Profile</DropdownMenuItem>

                <form action={logout}>
                  <button
                    type="submit"
                    className="w-full text-left px-2 py-1 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>

            </div>
          </div>
      </div>
      {children}
    </div>
  );
}