"use server"
import { getServerSession } from "next-auth";
import { authOptions } from "./utils";


//------------------------------auth------------------------------//
export async function updateProfile(formData: FormData) {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    throw new Error("Unauthorized");
  }

  const newName = formData.get("name");

  // Contoh menembak API Authentic untuk update data
  const res = await fetch("https://api.authentic.id/v1/user/update", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${session.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: newName }),
  });

  if (!res.ok) return { error: "Gagal update" };

  return { success: true };
};
export async function getSession() {
  return await getServerSession(authOptions);
};
