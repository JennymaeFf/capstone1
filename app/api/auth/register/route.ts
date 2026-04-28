import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

type AccountRole = "admin" | "customer";
type SupabaseStepError = {
  message?: string;
  details?: string;
  hint?: string;
  code?: string;
};

function normalizeRole(value: unknown): AccountRole {
  return value === "admin" ? "admin" : "customer";
}

function formatSupabaseError(step: string, error: SupabaseStepError) {
  return [
    `${step}: ${error.message || "Unknown Supabase error"}`,
    error.details ? `Details: ${error.details}` : "",
    error.hint ? `Hint: ${error.hint}` : "",
    error.code ? `Code: ${error.code}` : "",
  ].filter(Boolean).join(" ");
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
    console.log("[auth/register] Creating verified auth user", { email, role });

    const { data, error: createUserError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: name,
        role,
      },
    });

    if (createUserError) {
      const message = formatSupabaseError("Supabase Auth create user failed", createUserError);
      console.error("[auth/register] createUserError", createUserError);
      return NextResponse.json({ error: message }, { status: 400 });
    }

    if (!data.user) {
      return NextResponse.json({ error: "Account was not created." }, { status: 500 });
    }

    const userId = data.user.id;

    const profilePayload = {
      id: userId,
      full_name: name,
      is_admin: role === "admin",
    };
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(profilePayload, { onConflict: "id" });

    if (profileError) {
      console.error("[auth/register] profileError", profileError, { userId, email, role });

      const missingIsAdminColumn = profileError.message?.toLowerCase().includes("is_admin");
      if (missingIsAdminColumn) {
        const { error: fallbackProfileError } = await supabase
          .from("profiles")
          .upsert({ id: userId, full_name: name }, { onConflict: "id" });

        if (fallbackProfileError) {
          const message = formatSupabaseError("Profile insert failed", fallbackProfileError);
          console.error("[auth/register] fallbackProfileError", fallbackProfileError, { userId, email, role });
          return NextResponse.json({ error: message }, { status: 500 });
        }
      } else {
        const message = formatSupabaseError("Profile insert failed", profileError);
        return NextResponse.json({ error: message }, { status: 500 });
      }
    }

    const { error: roleError } = await supabase
      .from("app_users")
      .upsert({ id: userId, role }, { onConflict: "id" });

    if (roleError) {
      const message = formatSupabaseError("App user role insert failed", roleError);
      console.error("[auth/register] roleError", roleError, { userId, email, role });
      return NextResponse.json({ error: message }, { status: 500 });
    }

    console.log("[auth/register] Registration completed", { userId, email, role });
    return NextResponse.json({ role, userId, verified: true });
  } catch (error) {
    console.error("[auth/register]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to register account right now." },
      { status: 500 }
    );
  }
}
