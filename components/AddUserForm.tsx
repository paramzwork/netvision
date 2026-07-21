"use client"

import { useState } from "react"

export default function AddUserForm() {
  const [formData, setFormData] = useState({
    firstname: "",
    middlename: "",
    lastname: "",
    email: "",
    password: "",
    role_id: "",
  })

  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  function validate() {
    const newErrors: { [key: string]: string } = {}

    if (!formData.firstname) newErrors.firstname = "First name is required"
    if (!formData.lastname) newErrors.lastname = "Last name is required"
    if (!formData.email) newErrors.email = "Email is required"
    if (!formData.password || formData.password.length < 6)
      newErrors.password = "Password must be at least 6 characters"
    if (!formData.role_id) newErrors.role_id = "Role is required"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!validate()) return

    console.log("Submitted:", formData)

    // ✅ Replace with API call
    // await fetch("/api/users", { method: "POST", body: JSON.stringify(formData) })

    setFormData({
      firstname: "",
      middlename: "",
      lastname: "",
      email: "",
      password: "",
      role_id: "",
    })
  }

  return (
    <div className="max-w-3xl mx-auto bg-white dark:bg-zinc-900 border rounded-lg shadow-sm p-8">
      <h2 className="text-xl font-semibold mb-6">Add New User</h2>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Name Fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <p className="text-red-500 text-xs mt-1">
                {errors.firstname}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Middle Name
            </label>
            <input
              name="middlename"
              value={formData.middlename}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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
              <p className="text-red-500 text-xs mt-1">
                {errors.lastname}
              </p>
            )}
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Email *
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.email && (
            <p className="text-red-500 text-xs mt-1">
              {errors.email}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Password *
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.password && (
            <p className="text-red-500 text-xs mt-1">
              {errors.password}
            </p>
          )}
        </div>

        {/* Role */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Role *
          </label>
          <select
            name="role_id"
            value={formData.role_id}
            onChange={handleChange}
            className="w-full border rounded-md px-3 py-2 text-sm bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select role</option>
            <option value="1">Admin</option>
            <option value="2">Network Engineer</option>
            <option value="3">Viewer</option>
          </select>
          {errors.role_id && (
            <p className="text-red-500 text-xs mt-1">
              {errors.role_id}
            </p>
          )}
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-blue-600 text-white px-5 py-2 rounded-md text-sm hover:bg-blue-700 transition"
          >
            Create User
          </button>
        </div>

      </form>
    </div>
  )
}