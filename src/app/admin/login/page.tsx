"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ApiError, apiFetch } from "@/lib/client-api";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await apiFetch<{ user: { id: string; username: string } }>("/api/admin/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password })
      });
      router.replace("/admin/masterdata");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Login fehlgeschlagen";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <Card className="w-full max-w-md p-6">
        <h1 className="text-xl font-semibold text-slate-900">Admin Login</h1>
        <p className="mt-1 text-sm text-slate-600">Bitte anmelden, um Stammdaten und Einträge zu verwalten.</p>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <label className="block">
            <span className="mb-1 block text-sm text-slate-700">Benutzername</span>
            <Input value={username} onChange={(event) => setUsername(event.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-slate-700">Passwort</span>
            <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>

          {error ? <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}

          <Button type="submit" fullWidth disabled={loading}>
            {loading ? "Prüfe..." : "Anmelden"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
