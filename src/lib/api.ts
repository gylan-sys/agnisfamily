const API_BASE = "/api";

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem("token");
  const headers: any = {
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  // Only set Content-Type to application/json if we're not sending FormData
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  
  if (response.status === 401 || response.status === 403) {
    // Insufficient Permissions or token expired
    localStorage.removeItem("token");
    if (!window.location.pathname.startsWith("/auth")) {
      window.location.href = "/auth";
    }
    throw new Error("Insufficient Permissions");
  }

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Something went wrong");
  }

  return response.json();
}

export const api = {
  auth: {
    login: (data: any) => fetchWithAuth("/auth/login", { method: "POST", body: JSON.stringify(data) }),
    register: (data: any) => fetchWithAuth("/auth/register", { method: "POST", body: JSON.stringify(data) }),
    getProfile: () => fetchWithAuth("/user/profile"),
    updateProfile: (data: any) => fetchWithAuth("/user/profile", { method: "PUT", body: JSON.stringify(data) }),
  },
  transactions: {
    getAll: () => fetchWithAuth("/transactions"),
    create: (data: any) => fetchWithAuth("/transactions", { method: "POST", body: JSON.stringify(data) }),
    delete: (id: number) => fetchWithAuth(`/transactions/${id}`, { method: "DELETE" }),
  },
  budgets: {
    getAll: () => fetchWithAuth("/budgets"),
    create: (data: any) => fetchWithAuth("/budgets", { method: "POST", body: JSON.stringify(data) }),
  },
  bills: {
    getAll: () => fetchWithAuth("/bills"),
    create: (data: any) => fetchWithAuth("/bills", { method: "POST", body: JSON.stringify(data) }),
    updateStatus: (id: number, status: string) => fetchWithAuth(`/bills/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  },
  tasks: {
    getAll: () => fetchWithAuth("/tasks"),
    create: (data: any) => fetchWithAuth("/tasks", { method: "POST", body: JSON.stringify(data) }),
    updateStatus: (id: number, status: string) => fetchWithAuth(`/tasks/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  },
  grocery: {
    getAll: () => fetchWithAuth("/grocery"),
    create: (data: any) => fetchWithAuth("/grocery", { method: "POST", body: JSON.stringify(data) }),
    updateStatus: (id: number, status: string) => fetchWithAuth(`/grocery/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
    clearCompleted: () => fetchWithAuth("/grocery/completed", { method: "DELETE" }),
  },
  chat: {
    getAll: () => fetchWithAuth("/chat"),
    send: (message: string) => fetchWithAuth("/chat", { method: "POST", body: JSON.stringify({ message }) }),
  },
  gallery: {
    getAll: () => fetchWithAuth("/gallery"),
    add: (data: any) => fetchWithAuth("/gallery", { method: "POST", body: JSON.stringify(data) }),
  },
  upload: (file: File, onProgress?: (percent: number) => void): Promise<{ url: string }> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const token = localStorage.getItem("token");
      
      xhr.open("POST", `${API_BASE}/upload`);
      if (token) {
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      }
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };
      
      xhr.onload = () => {
        if (xhr.status === 200 || xhr.status === 201) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch (e) {
            reject(new Error("Invalid response from server"));
          }
        } else {
          if (xhr.status === 401 || xhr.status === 403) {
            localStorage.removeItem("token");
            if (!window.location.pathname.startsWith("/auth")) {
              window.location.href = "/auth";
            }
          }
          try {
            const err = JSON.parse(xhr.responseText);
            reject(new Error(err.error || "Upload failed"));
          } catch (e) {
            reject(new Error(`Server error: ${xhr.status}`));
          }
        }
      };
      
      xhr.onerror = () => {
        reject(new Error("Network connection failed during upload"));
      };
      
      const formData = new FormData();
      formData.append("file", file);
      xhr.send(formData);
    });
  },
  users: {
    getAll: () => fetchWithAuth("/users"),
    create: (data: any) => fetchWithAuth("/admin/users", { method: "POST", body: JSON.stringify(data) }),
    updateRole: (id: number, role: string) => fetchWithAuth(`/admin/users/${id}/role`, { method: "PATCH", body: JSON.stringify({ role }) }),
    delete: (id: number) => fetchWithAuth(`/admin/users/${id}`, { method: "DELETE" }),
    changePassword: (data: any) => fetchWithAuth("/user/change-password", { method: "POST", body: JSON.stringify(data) }),
  },
  ai: {
    chat: (messages: { role: 'user' | 'assistant'; content: string }[]) => 
      fetchWithAuth("/ai/assistant", { method: "POST", body: JSON.stringify({ messages }) }),
  }
};
