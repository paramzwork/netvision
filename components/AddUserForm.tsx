"use client";

import { RoleTypes, UserTypes } from "@/lib/types";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { tripleEncode } from "@/lib/utils";
import { useData } from "@/context/DataContext";
import { useRouter } from "next/navigation";

interface Props {
  roleData: RoleTypes[];
  setOpenUserForm: React.Dispatch<React.SetStateAction<boolean>>;
  userFormType: string;
  data: UserTypes | null;
  setData: React.Dispatch<React.SetStateAction<UserTypes | null>>;
  setUsers: React.Dispatch<React.SetStateAction<UserTypes[]>>;
}
export default function AddUserForm({
  roleData,
  setOpenUserForm,
  userFormType,
  data,
  setData,
  setUsers,
}: Props) {
  const { currentUser } = useData();
  const router = useRouter();

  const [formData, setFormData] = useState({
    username: data?.username ?? "",
    firstname: data?.firstname ?? "",
    lastname: data?.lastname ?? "",
    email: data?.email ?? "",
    password: data?.password ?? "",
    roleId: data?.roles.id ?? 3,
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
  function handleSelectChange(name: string, value: string) {
    setFormData((prev) => ({
      ...prev,
      [name]: name === "roleId" ? Number(value) : value,
    }));
  }
  function validate() {
    const newErrors: { [key: string]: string } = {};

    if (!formData.username) newErrors.username = "Username is required";
    if (!formData.firstname) newErrors.firstname = "First name is required";
    // if (!formData.lastname) newErrors.lastname = "Last name is required";
    if (!formData.email) newErrors.email = "Email is required";
    // if (!formData.password || formData.password.length < 6)
    //   newErrors.password = "Password must be at least 6 characters";
    if (!formData.roleId) newErrors.roleId = "Role is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;
    try {
      const id = tripleEncode(String(data?.id));
      const url = userFormType === "create" ? "/api/users" : `/api/users/${id}`;
      const method = userFormType === "create" ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        body: JSON.stringify(formData),
      });
      const resData = await res.json();
      if (res.status === 401) {
        router.replace("/");
        return;
      }
      if (!res.ok) {
        toast.error(resData.message);
        return;
      }
      if (userFormType === "create") {
        setUsers((current) => [...current, resData.data]);
      } else {
        setUsers((current) =>
          current.map((user) =>
            user.id === resData.data.id ? resData.data : user,
          ),
        );
      }
      setFormData({
        username: "",
        firstname: "",
        lastname: "",
        email: "",
        password: "",
        roleId: 0,
      });
      setData(null);
      setOpenUserForm(false);
      toast.success(resData.message);
    } catch {
      toast.error("Internal Server Error.", {
        description: "Server error please contact admin.",
      });
    }
  };
  return (
    <div className="max-w-4xl mx-auto bg-background ">
      {/* Header */}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Name Fields */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className={
                  errors.username
                    ? "border-destructive focus-visible:ring-destructive"
                    : ""
                }
              />
              {errors.username && (
                <p className="text-destructive text-xs mt-1">
                  {errors.username}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="firstname">First Name *</Label>
              <Input
                id="firstname"
                name="firstname"
                value={formData.firstname}
                onChange={handleChange}
                className={
                  errors.firstname
                    ? "border-destructive focus-visible:ring-destructive"
                    : ""
                }
              />
              {errors.firstname && (
                <p className="text-destructive text-xs mt-1">
                  {errors.firstname}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastname">Last Name </Label>
              <Input
                id="lastname"
                name="lastname"
                value={formData.lastname}
                onChange={handleChange}
                className={
                  errors.lastname
                    ? "border-destructive focus-visible:ring-destructive"
                    : ""
                }
              />
              {errors.lastname && (
                <p className="text-destructive text-xs mt-1">
                  {errors.lastname}
                </p>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={
                errors.email
                  ? "border-destructive focus-visible:ring-destructive"
                  : ""
              }
            />
            {errors.email && (
              <p className="text-destructive text-xs mt-1">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">Password *</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`pr-10 ${errors.password ? "border-destructive focus-visible:ring-destructive" : ""}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-destructive text-xs mt-1">{errors.password}</p>
            )}
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label htmlFor="role">Role *</Label>
            <Select
              name="roleId"
              value={String(formData.roleId)}
              onValueChange={(value) =>
                handleSelectChange("roleId", value as string)
              }
            >
              <SelectTrigger
                id="role"
                className={
                  errors.roleId
                    ? "border-destructive focus-visible:ring-destructive"
                    : ""
                }
              >
                <SelectValue placeholder="Select a role">
                  {roleData.find((role) => role.id === Number(formData.roleId))
                    ?.role || "Select a role"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Select a role</SelectItem>
                {roleData
                  .filter(
                    (role) =>
                      !(
                        currentUser.roles.role.toLowerCase() === "admin" &&
                        role.id === 1
                      ),
                  )
                  .map((role) => (
                    <SelectItem key={role.id} value={String(role.id)}>
                      {role.role}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {errors.roleId && (
              <p className="text-destructive text-xs mt-1">{errors.roleId}</p>
            )}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpenUserForm(false)}
          >
            Cancel
          </Button>
          <Button type="submit">
            {userFormType === "create" ? "Create User" : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
