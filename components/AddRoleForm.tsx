"use client";

import { useState } from "react";
import { toast } from "sonner";

export default function AddRoleForm() {
  const [loading, setLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    role: "",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  function validate() {
    const newErrors: { [key: string]: string } = {};

    if (!formData.role) newErrors.role = "Role is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      setLoading(true);
      const res = await fetch("/api/users/role", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message);
        setLoading(false);
        return;
      }
      setFormData({
        role: "",
      });
      setLoading(false);
      toast.success(data.message);
    } catch {
      toast.error("Internal Server Error.", {
        description: "Server error please contact admin.",
      });
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white dark:bg-zinc-900 border rounded-lg shadow-sm p-8">
      <h2 className="text-xl font-semibold mb-6">Add New Role</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name Fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <input
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.role && (
              <p className="text-red-500 text-xs mt-1">{errors.role}</p>
            )}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-5 py-2 rounded-md text-sm hover:bg-blue-700 transition cursor-pointer"
          >
            {loading ? "Processing..." : "Create Role"}
          </button>
        </div>
      </form>
    </div>
  );
}
