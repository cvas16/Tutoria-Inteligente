import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default function RootPage() {
  const cookieStore = cookies();
  const token = cookieStore.get("its_session_token")?.value;
  const role = cookieStore.get("its_user_role")?.value;

  if (!token) {
    redirect("/login");
  }

  if (role === "TUTOR" || role === "ADMIN") {
    redirect("/tutor");
  }

  redirect("/student");
}