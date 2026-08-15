"use client";

import { RoleTypes, UserTypes } from "@/lib/types";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
  roleData: RoleTypes[];
  setOpenUserForm: React.Dispatch<React.SetStateAction<boolean>>;
  userFormType: string;
  data: UserTypes | null;
}
export default function AddUserForm({
  roleData,
  setOpenUserForm,
  userFormType,
  data,
}: Props) {
  const [formData, setFormData] = useState({
    username: data?.username ?? "",
    firstname: data?.firstname ?? "",
    lastname: data?.lastname ?? "",
    email: data?.email ?? "",
    password: data?.password ?? "",
    roleId: data?.roles.id ?? 0,
  });
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: name === "roleId" ? Number(value) : value,
    }));
  }

  function validate() {
    const newErrors: { [key: string]: string } = {};

    if (!formData.username) newErrors.username = "Username is required";
    if (!formData.firstname) newErrors.firstname = "First name is required";
    if (!formData.lastname) newErrors.lastname = "Last name is required";
    if (!formData.email) newErrors.email = "Email is required";
    if (!formData.password || formData.password.length < 6)
      newErrors.password = "Password must be at least 6 characters";
    if (!formData.roleId) newErrors.roleId = "Role is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      const resData = await res.json();
      if (!res.ok) {
        toast.error(resData.message);
        return;
      }
      setFormData({
        username: "",
        firstname: "",
        lastname: "",
        email: "",
        password: "",
        roleId: 0,
      });
      setOpenUserForm(false);
      toast.success(resData.message);
    } catch {
      toast.error("Internal Server Error.", {
        description: "Server error please contact admin.",
      });
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white dark:bg-zinc-900 border rounded-lg shadow-sm p-8">
      <h2 className="text-xl font-semibold mb-6">
        {userFormType === "create" ? "Create" : "Update"} New User
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name Fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Username *</label>
            <input
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.username && (
              <p className="text-red-500 text-xs mt-1">{errors.firstname}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              First Name *
            </label>
            <input
              name="firstname"
              value={formData.firstname}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.firstname && (
              <p className="text-red-500 text-xs mt-1">{errors.firstname}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Last Name *
            </label>
            <input
              name="lastname"
              value={formData.lastname}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.lastname && (
              <p className="text-red-500 text-xs mt-1">{errors.lastname}</p>
            )}
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium mb-1">Email *</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.email && (
            <p className="text-red-500 text-xs mt-1">{errors.email}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium mb-1">Password *</label>
          <div className="w-full flex flex-row items-center border rounded-md">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full border-none rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password}</p>
            )}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-muted-foreground cursor-pointer mr-3"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Role */}
        <div>
          <label className="block text-sm font-medium mb-1">Role *</label>
          <select
            name="roleId"
            value={formData.roleId}
            onChange={handleChange}
            className="w-full border rounded-md px-3 py-2 text-sm bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={0}>Select a role</option>

            {roleData.map((role) => (
              <option key={role.id} value={role.id}>
                {role.role}
              </option>
            ))}
          </select>
          {errors.roleId && (
            <p className="text-red-500 text-xs mt-1">{errors.roleId}</p>
          )}
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-blue-600 text-white px-5 py-2 rounded-md text-sm hover:bg-blue-700 transition"
          >
            {userFormType === "create" ? "Create" : "Update"} User
          </button>
        </div>
      </form>
    </div>
  );
}
