import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/utils";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return new NextResponse(null, { status: 401 });
  }

  return NextResponse.json({
    id: (session.user as { id?: string }).id ?? session.user.email ?? "",
    email: session.user.email ?? "",
    name: session.user.name ?? "",
    role: "worker",
  });
}
