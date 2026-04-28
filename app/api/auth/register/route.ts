import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

type AccountRole = "admin" | "customer";

function normalizeRole(value: unknown): AccountRole {
  return value === "admin" ? "admin" : "customer";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const role = normalizeRole(body.role);

    if (!name || !email || !email.includes("@") || !password) {
      return NextResponse.json({ error: "Name, email, and password are required." }, { status: 400 });
    }

    const supabase = getSupabaseServiceClient();
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: name,
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message || "Unable to create account." }, { status: 400 });
    }

    if (!data.user) {
      return NextResponse.json({ error: "Account was not created." }, { status: 500 });
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({ id: data.user.id, full_name: name }, { onConflict: "id" });

    if (profileError) throw profileError;

    const { error: roleError } = await supabase
      .from("app_users")
      .upsert({ id: data.user.id, role }, { onConflict: "id" });

    if (roleError) throw roleError;

    return NextResponse.json({ role, userId: data.user.id });
  } catch (error) {
    console.error("[auth/register]", error);
    return NextResponse.json({ error: "Unable to register account right now." }, { status: 500 });
  }
}
