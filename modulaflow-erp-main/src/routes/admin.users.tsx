import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/admin/users")({
  component: UsersPage,
});

type UserStatus = "Active" | "Inactive";

type User = {
  id: number;
  name: string;
  email: string;
  mobile: string;
  role: string;
  department: string;
  status: UserStatus;
  lastLogin: string;
};

const initialUsers: User[] = [
  {
    id: 1,
    name: "Amit Deshmukh",
    email: "amit.deshmukh@payaldecor.com",
    mobile: "9876543210",
    role: "Admin",
    department: "Management",
    status: "Active",
    lastLogin: "09 Sep 2026\n11:20 AM",
  },
  {
    id: 2,
    name: "Pooja Kulkarni",
    email: "pooja.kulkarni@payaldecor.com",
    mobile: "9876543211",
    role: "Project Manager",
    department: "Projects",
    status: "Active",
    lastLogin: "09 Sep 2026\n10:45 AM",
  },
  {
    id: 3,
    name: "Rohit Shinde",
    email: "rohit.shinde@payaldecor.com",
    mobile: "9876543212",
    role: "Sales Executive",
    department: "Sales",
    status: "Active",
    lastLogin: "08 Sep 2026\n06:15 PM",
  },
  {
    id: 4,
    name: "Sneha Patil",
    email: "sneha.patil@payaldecor.com",
    mobile: "9876543213",
    role: "Purchase Executive",
    department: "Purchase",
    status: "Active",
    lastLogin: "08 Sep 2026\n03:40 PM",
  },
  {
    id: 5,
    name: "Vikas More",
    email: "vikas.more@payaldecor.com",
    mobile: "9876543214",
    role: "Production Incharge",
    department: "Production",
    status: "Inactive",
    lastLogin: "05 Sep 2026\n01:12 PM",
  },
  {
    id: 6,
    name: "Meera Joshi",
    email: "meera.joshi@payaldecor.com",
    mobile: "9876543215",
    role: "Accountant",
    department: "Accounts",
    status: "Active",
    lastLogin: "09 Sep 2026\n09:30 AM",
  },
];

function UsersPage() {
  const [users, setUsers] = useState<User[]>(initialUsers);

  const [search, setSearch] = useState("");
  const [role, setRole] = useState("All Roles");
  const [department, setDepartment] = useState("All Departments");
  const [status, setStatus] = useState("All Status");

  // Add User Modal
  const [showAddUser, setShowAddUser] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [newRole, setNewRole] = useState("Admin");
  const [newDepartment, setNewDepartment] = useState("Management");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newStatus, setNewStatus] = useState<UserStatus>("Active");

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const searchMatch =
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase());

      const roleMatch =
        role === "All Roles" || user.role === role;

      const departmentMatch =
        department === "All Departments" ||
        user.department === department;

      const statusMatch =
        status === "All Status" || user.status === status;

      return (
        searchMatch &&
        roleMatch &&
        departmentMatch &&
        statusMatch
      );
    });
  }, [users, search, role, department, status]);

  const resetFilters = () => {
    setSearch("");
    setRole("All Roles");
    setDepartment("All Departments");
    setStatus("All Status");
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setMobile("");
    setNewRole("Admin");
    setNewDepartment("Management");
    setPassword("");
    setConfirmPassword("");
    setNewStatus("Active");
  };

  const handleAddUser = () => {
    if (!name.trim()) {
      alert("Please enter full name.");
      return;
    }

    if (!email.trim()) {
      alert("Please enter email address.");
      return;
    }

    if (!mobile.trim()) {
      alert("Please enter mobile number.");
      return;
    }

    if (!password) {
      alert("Please enter password.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Password and Confirm Password do not match.");
      return;
    }

    const newUser: User = {
      id: users.length + 1,
      name: name.trim(),
      email: email.trim(),
      mobile: mobile.trim(),
      role: newRole,
      department: newDepartment,
      status: newStatus,
      lastLogin: "Never",
    };

    setUsers((prevUsers) => [...prevUsers, newUser]);

    resetForm();
    setShowAddUser(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="mb-3 text-sm text-muted-foreground">
            Admin &nbsp;›&nbsp; Users
          </div>

          <h1 className="text-2xl font-semibold">
            Users
          </h1>

          <p className="text-muted-foreground">
            Manage system users, add, edit or deactivate users and assign roles.
          </p>
        </div>

        {/* ADD USER BUTTON */}
        <button
          type="button"
          onClick={() => setShowAddUser(true)}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          + Add User
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-lg border p-4">
        <div className="grid gap-3 md:grid-cols-4 lg:grid-cols-5">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by name or email..."
            className="rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          />

          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option>All Roles</option>
            <option>Admin</option>
            <option>Project Manager</option>
            <option>Sales Executive</option>
            <option>Purchase Executive</option>
            <option>Production Incharge</option>
            <option>Accountant</option>
          </select>

          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option>All Departments</option>
            <option>Management</option>
            <option>Projects</option>
            <option>Sales</option>
            <option>Purchase</option>
            <option>Production</option>
            <option>Accounts</option>
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option>All Status</option>
            <option>Active</option>
            <option>Inactive</option>
          </select>

          <button
            type="button"
            onClick={resetFilters}
            className="rounded-md border px-4 py-2 text-sm hover:bg-muted"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr className="border-b">
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-left">Department</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Last Login</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="border-b last:border-0 hover:bg-muted/20"
                >
                  <td className="px-4 py-4">
                    {user.id}
                  </td>

                  <td className="px-4 py-4 font-medium">
                    {user.name}
                  </td>

                  <td className="px-4 py-4 text-muted-foreground">
                    {user.email}
                  </td>

                  <td className="px-4 py-4">
                    {user.role}
                  </td>

                  <td className="px-4 py-4">
                    {user.department}
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={
                        user.status === "Active"
                          ? "rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700"
                          : "rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-medium text-yellow-700"
                      }
                    >
                      {user.status}
                    </span>
                  </td>

                  <td className="whitespace-pre-line px-4 py-4 text-muted-foreground">
                    {user.lastLogin}
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="rounded-md border px-2 py-1 hover:bg-muted"
                        title="Edit"
                      >
                        ✎
                      </button>

                      <button
                        type="button"
                        className="rounded-md border px-2 py-1 hover:bg-muted"
                        title="More"
                      >
                        ⋮
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredUsers.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center text-muted-foreground"
                  >
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-muted-foreground">
          <span>
            Showing {filteredUsers.length} of {users.length} users
          </span>

          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-md border px-3 py-1"
            >
              ‹
            </button>

            <button
              type="button"
              className="rounded-md bg-primary px-3 py-1 text-primary-foreground"
            >
              1
            </button>

            <button
              type="button"
              className="rounded-md border px-3 py-1"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {/* ================= ADD USER MODAL ================= */}

      {showAddUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-background shadow-xl">

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h2 className="text-xl font-semibold">
                  Add New User
                </h2>

                <p className="text-sm text-muted-foreground">
                  Create a new system user and assign a role.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setShowAddUser(false);
                }}
                className="rounded-md px-2 py-1 text-xl hover:bg-muted"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="grid gap-4 px-6 py-6 md:grid-cols-2">

              {/* Full Name */}
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium">
                  Full Name <span className="text-red-500">*</span>
                </label>

                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter full name"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Email */}
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Email Address <span className="text-red-500">*</span>
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Mobile */}
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Mobile Number <span className="text-red-500">*</span>
                </label>

                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="Enter mobile number"
                  maxLength={10}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Role */}
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Role <span className="text-red-500">*</span>
                </label>

                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                >
                  <option>Admin</option>
                  <option>Project Manager</option>
                  <option>Sales Executive</option>
                  <option>Purchase Executive</option>
                  <option>Production Incharge</option>
                  <option>Accountant</option>
                </select>
              </div>

              {/* Department */}
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Department <span className="text-red-500">*</span>
                </label>

                <select
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                >
                  <option>Management</option>
                  <option>Projects</option>
                  <option>Sales</option>
                  <option>Purchase</option>
                  <option>Production</option>
                  <option>Accounts</option>
                </select>
              </div>

              {/* Password */}
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Password <span className="text-red-500">*</span>
                </label>

                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Confirm Password <span className="text-red-500">*</span>
                </label>

                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Status */}
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Status
                </label>

                <select
                  value={newStatus}
                  onChange={(e) =>
                    setNewStatus(e.target.value as UserStatus)
                  }
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 border-t px-6 py-4">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setShowAddUser(false);
                }}
                className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleAddUser}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Create User
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}