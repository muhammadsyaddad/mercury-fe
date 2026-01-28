import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { getSession } from "@/lib/action";
import { redirect } from "next/navigation";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch server-side session and pass it down to the Sidebar component so
  // it can render user info without relying on client-only hooks.
  const session = await getSession();

  // Redirect to login if not authenticated
  if (!session) {
    redirect("/login");
  }

  return (
    <div>
      <div className="relative">
        <Sidebar initialUser={session} />

        <div className="md:ml-[70px] pb-8">
          <Header />
          <div className="p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
