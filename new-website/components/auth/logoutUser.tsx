"use client"
import { signOut } from "firebase/auth";
import { auth } from "../../app/firebase/config";
import { setCookie } from "@/components/auth/setCookie";
import { useRouter } from "next/navigation";

export function LogoutUser() {
  const router = useRouter();
  const handleLogout = () =>
    signOut(auth)
      .then(() => {
        window.location.reload()
        setCookie("user", "false");
      })
      .catch((error) => {
        // An error happened.
      });

  return (
    <a
      href=""
      className="text-gray-300 hover:bg-gray-200 hover:text-gray-800 rounded-md px-3 py-2 text-sm font-medium"
      onClick={handleLogout}
    >
      Logout
    </a>
  );
}
