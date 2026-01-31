"use client";

import { useEffect, useMemo, useState } from "react";

type DatasetRun = {
  id: string;
  status: string;
  startedAt: string;
  finishedAt: string | null;
  logs: string | null;
  errorMessage: string | null;
  source: {
    name: string;
  };
};

type UserRow = {
  id: string;
  userId: string;
  role: "ADMIN" | "USER";
  createdAt: string;
};

export default function AdminDashboard() {
  const [runs, setRuns] = useState<DatasetRun[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadRuns = async () => {
    const res = await fetch("/api/admin/runs");
    if (res.ok) {
      const data = await res.json();
      setRuns(data.runs || []);
    }
  };

  const loadUsers = async () => {
    const res = await fetch("/api/admin/users");
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users || []);
    }
  };

  const handleSync = async (target: "ibge" | "tse" | "all") => {
    setError(null);
    setSyncing(target);
    try {
      const res = await fetch(`/api/sync/${target}`, { method: "POST" });
      if (!res.ok) {
        const payload = await res.json();
        throw new Error(payload.error || "Falha ao sincronizar");
      }
      await loadRuns();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao sincronizar");
    } finally {
      setSyncing(null);
    }
  };

  const handleRoleChange = async (userId: string, role: "ADMIN" | "USER") => {
    setError(null);
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role }),
    });

    if (!res.ok) {
      const payload = await res.json();
      setError(payload.error || "Falha ao atualizar usuario");
      return;
    }
    await loadUsers();
  };

  useEffect(() => {
    loadRuns();
    loadUsers();
  }, []);

  const runRows = useMemo(() => runs.slice(0, 10), [runs]);

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div>
          <h1>Painel Admin</h1>
          <p>Sincronize dados e gerencie usuarios.</p>
        </div>
      </header>

      {error && <div className="admin-error">{error}</div>}

      <section className="admin-section">
        <h2>Sincronizacao</h2>
        <div className="admin-actions">
          <button
            className="admin-btn"
            onClick={() => handleSync("ibge")}
            disabled={syncing !== null}
          >
            {syncing === "ibge" ? "Sincronizando..." : "Sincronizar IBGE"}
          </button>
          <button
            className="admin-btn"
            onClick={() => handleSync("tse")}
            disabled={syncing !== null}
          >
            {syncing === "tse" ? "Sincronizando..." : "Sincronizar TSE"}
          </button>
          <button
            className="admin-btn admin-btn-primary"
            onClick={() => handleSync("all")}
            disabled={syncing !== null}
          >
            {syncing === "all" ? "Sincronizando..." : "Sincronizar Tudo"}
          </button>
        </div>
      </section>

      <section className="admin-section">
        <h2>Ultimas execucoes</h2>
        <div className="admin-table">
          <table>
            <thead>
              <tr>
                <th>Fonte</th>
                <th>Status</th>
                <th>Inicio</th>
                <th>Fim</th>
                <th>Erro</th>
              </tr>
            </thead>
            <tbody>
              {runRows.length === 0 && (
                <tr>
                  <td colSpan={5} className="admin-empty">
                    Nenhuma execucao registrada.
                  </td>
                </tr>
              )}
              {runRows.map((run) => (
                <tr key={run.id}>
                  <td>{run.source?.name || "-"}</td>
                  <td>{run.status}</td>
                  <td>{new Date(run.startedAt).toLocaleString("pt-BR")}</td>
                  <td>
                    {run.finishedAt
                      ? new Date(run.finishedAt).toLocaleString("pt-BR")
                      : "-"}
                  </td>
                  <td className="admin-error-cell">
                    {run.errorMessage || run.logs || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-section">
        <h2>Usuarios</h2>
        <div className="admin-table">
          <table>
            <thead>
              <tr>
                <th>User ID</th>
                <th>Role</th>
                <th>Criado em</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="admin-empty">
                    Nenhum usuario encontrado.
                  </td>
                </tr>
              )}
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.userId}</td>
                  <td>{user.role}</td>
                  <td>{new Date(user.createdAt).toLocaleString("pt-BR")}</td>
                  <td>
                    <div className="admin-role-actions">
                      <button
                        className="admin-btn"
                        onClick={() => handleRoleChange(user.userId, "ADMIN")}
                      >
                        Promover
                      </button>
                      <button
                        className="admin-btn"
                        onClick={() => handleRoleChange(user.userId, "USER")}
                      >
                        Rebaixar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
