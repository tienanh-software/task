const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
async function request(path, options = {}) {
  const response = await fetch(`${BASE}${path}`, {
    ...options, headers: { "Content-Type": "application/json", ...options.headers }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Request failed");
  return data;
}
export const api = {
  tasks: (params = {}) => request(`/tasks?${new URLSearchParams(params)}`),
  createTask: (body) => request("/tasks", { method: "POST", body: JSON.stringify(body) }),
  updateTask: (id, body) => request(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteTask: (id) => request(`/tasks/${id}`, { method: "DELETE" }),
  notifications: () => request("/notifications"),
  readNotification: (id) => request(`/notifications/${id}/read`, { method: "PATCH" }),
};
