import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/admin/roles-permissions")({
  component: RolesPermissionsPage,
});

type RoleStatus = "Active" | "Inactive";

type Role = {
  name: string;
  users: number;
  description: string;
  status: RoleStatus;
};

type Permission = {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  approve: boolean;
};

type Permissions = Record<string, Record<string, Permission>>;

const initialRoles: Role[] = [
  {
    name: "Admin",
    users: 2,
    description: "Full system access",
    status: "Active",
  },
  {
    name: "Project Manager",
    users: 3,
    description: "Manage projects and project activities",
    status: "Active",
  },
  {
    name: "Sales Executive",
    users: 5,
    description: "Manage customers, quotations and sales",
    status: "Active",
  },
  {
    name: "Purchase Executive",
    users: 3,
    description: "Manage purchases and vendors",
    status: "Active",
  },
  {
    name: "Production Incharge",
    users: 4,
    description: "Manage production activities",
    status: "Active",
  },
  {
    name: "Inventory Executive",
    users: 2,
    description: "Manage inventory and stock",
    status: "Active",
  },
  {
    name: "Accounts",
    users: 3,
    description: "Manage accounts and payments",
    status: "Active",
  },
  {
    name: "Installation Engineer",
    users: 2,
    description: "Manage installation activities",
    status: "Active",
  },
  {
    name: "Viewer",
    users: 1,
    description: "View-only access",
    status: "Active",
  },
];

const modules = [
  "CRM",
  "Projects",
  "Estimation & BOQ",
  "Quotations",
  "Sales Orders",
  "Work Orders",
  "Production",
  "Inventory",
  "Purchase",
  "Vendors",
  "Dispatch & Delivery",
  "Installation",
  "Invoicing",
  "Payments",
  "Accounts",
  "Reports",
];

const permissionTypes = [
  "view",
  "create",
  "edit",
  "delete",
  "approve",
] as const;

type PermissionType = (typeof permissionTypes)[number];

const createDefaultPermissions = (): Record<
  string,
  Permission
> => {
  return modules.reduce(
    (acc, module) => {
      acc[module] = {
        view: true,
        create: true,
        edit: true,
        delete: false,
        approve: false,
      };

      return acc;
    },
    {} as Record<string, Permission>
  );
};

const createInitialPermissions = (): Permissions => {
  return initialRoles.reduce(
    (acc, role) => {
      acc[role.name] = createDefaultPermissions();
      return acc;
    },
    {} as Permissions
  );
};

function RolesPermissionsPage() {
  const [roles, setRoles] = useState<Role[]>(initialRoles);

  const [selectedRole, setSelectedRole] =
    useState("Project Manager");

  const [permissions, setPermissions] =
    useState<Permissions>(
      createInitialPermissions()
    );

  const [searchRole, setSearchRole] = useState("");

  const [showAddRole, setShowAddRole] = useState(false);

  const [newRole, setNewRole] = useState("");

  const [roleDescription, setRoleDescription] =
    useState("");

  const [roleStatus, setRoleStatus] =
    useState<RoleStatus>("Active");

  const [copyRole, setCopyRole] = useState("");

  const filteredRoles = roles.filter((role) =>
    role.name
      .toLowerCase()
      .includes(searchRole.toLowerCase())
  );

  const togglePermission = (
    module: string,
    permission: PermissionType
  ) => {
    setPermissions((current) => ({
      ...current,
      [selectedRole]: {
        ...current[selectedRole],
        [module]: {
          ...current[selectedRole][module],
          [permission]:
            !current[selectedRole][module][permission],
        },
      },
    }));
  };

  const handleAddRole = () => {
    const roleName = newRole.trim();

    if (!roleName) {
      alert("Please enter role name.");
      return;
    }

    const roleExists = roles.some(
      (role) =>
        role.name.toLowerCase() ===
        roleName.toLowerCase()
    );

    if (roleExists) {
      alert("This role already exists.");
      return;
    }

    const newRoleData: Role = {
      name: roleName,
      users: 0,
      description:
        roleDescription.trim() ||
        "No description provided",
      status: roleStatus,
    };

    setRoles((current) => [
      ...current,
      newRoleData,
    ]);

    setPermissions((current) => ({
      ...current,
      [roleName]: createDefaultPermissions(),
    }));

    setSelectedRole(roleName);

    setNewRole("");
    setRoleDescription("");
    setRoleStatus("Active");

    setShowAddRole(false);
  };

  const handleCopyPermissions = () => {
    if (!copyRole) {
      alert(
        "Please select a role to copy permissions from."
      );
      return;
    }

    setPermissions((current) => ({
      ...current,
      [selectedRole]: JSON.parse(
        JSON.stringify(current[copyRole])
      ),
    }));

    setCopyRole("");

    alert(
      `Permissions copied from ${copyRole}.`
    );
  };

  const handleSavePermissions = () => {
    console.log(
      "Saved permissions:",
      selectedRole,
      permissions[selectedRole]
    );

    alert(
      `Permissions for "${selectedRole}" saved successfully.`
    );
  };

  const handleResetPermissions = () => {
    const confirmReset = window.confirm(
      "Are you sure you want to reset permissions?"
    );

    if (!confirmReset) return;

    setPermissions((current) => ({
      ...current,
      [selectedRole]:
        createDefaultPermissions(),
    }));
  };

  const handleDeleteRole = (roleName: string) => {
    if (roleName === "Admin") {
      alert("Admin role cannot be deleted.");
      return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${roleName}" role?`
    );

    if (!confirmDelete) return;

    setRoles((current) =>
      current.filter(
        (role) => role.name !== roleName
      )
    );

    setPermissions((current) => {
      const updated = { ...current };
      delete updated[roleName];
      return updated;
    });

    if (selectedRole === roleName) {
      setSelectedRole("Project Manager");
    }
  };

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

        <div>
          <div className="mb-3 text-sm text-muted-foreground">
            Admin &nbsp;›&nbsp; Roles & Permissions
          </div>

          <h1 className="text-2xl font-semibold">
            Roles & Permissions
          </h1>

          <p className="mt-1 text-muted-foreground">
            Manage roles and configure module-wise permissions.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddRole(true)}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          + Add Role
        </button>

      </div>

      {/* MAIN */}
      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">

        {/* ROLES */}
        <div className="rounded-lg border bg-background">

          <div className="border-b p-4">
            <input
              value={searchRole}
              onChange={(e) =>
                setSearchRole(e.target.value)
              }
              placeholder="Search roles..."
              className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            {filteredRoles.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                No roles found.
              </div>
            ) : (
              filteredRoles.map((role) => (
                <div
                  key={role.name}
                  className={`group flex items-center border-b last:border-0 ${
                    selectedRole === role.name
                      ? "bg-muted"
                      : "hover:bg-muted/40"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedRole(role.name)
                    }
                    className="flex flex-1 items-center justify-between px-4 py-3 text-left text-sm"
                  >
                    <div className="flex flex-col">
                      <span
                        className={
                          selectedRole === role.name
                            ? "font-medium"
                            : ""
                        }
                      >
                        {role.name}
                      </span>

                      <span className="mt-1 text-xs text-muted-foreground">
                        {role.status}
                      </span>
                    </div>

                    <span className="text-muted-foreground">
                      {role.users}
                    </span>
                  </button>

                  {role.name !== "Admin" && (
                    <button
                      type="button"
                      onClick={() =>
                        handleDeleteRole(role.name)
                      }
                      className="mr-3 hidden text-xs text-red-500 group-hover:block"
                    >
                      Delete
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

        </div>

        {/* PERMISSIONS */}
        <div className="rounded-lg border bg-background">

          <div className="flex flex-col gap-4 border-b p-4 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <h2 className="font-semibold">
                {selectedRole}
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                {
                  roles.find(
                    (role) =>
                      role.name === selectedRole
                  )?.description
                }
              </p>
            </div>

            <div className="flex items-center gap-2">

              <select
                value={copyRole}
                onChange={(e) =>
                  setCopyRole(e.target.value)
                }
                className="rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="">
                  Copy from Role
                </option>

                {roles
                  .filter(
                    (role) =>
                      role.name !== selectedRole
                  )
                  .map((role) => (
                    <option
                      key={role.name}
                      value={role.name}
                    >
                      {role.name}
                    </option>
                  ))}
              </select>

              <button
                type="button"
                onClick={handleCopyPermissions}
                className="rounded-md border px-3 py-2 text-sm hover:bg-muted"
              >
                Copy
              </button>

            </div>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full text-sm">

              <thead className="bg-muted/40">
                <tr className="border-b">

                  <th className="px-4 py-3 text-left">
                    Module
                  </th>

                  <th className="px-4 py-3 text-center">
                    View
                  </th>

                  <th className="px-4 py-3 text-center">
                    Create
                  </th>

                  <th className="px-4 py-3 text-center">
                    Edit
                  </th>

                  <th className="px-4 py-3 text-center">
                    Delete
                  </th>

                  <th className="px-4 py-3 text-center">
                    Approve
                  </th>

                </tr>
              </thead>

              <tbody>

                {modules.map((module) => (
                  <tr
                    key={module}
                    className="border-b last:border-0"
                  >

                    <td className="px-4 py-3 font-medium">
                      {module}
                    </td>

                    {permissionTypes.map(
                      (permission) => (
                        <td
                          key={permission}
                          className="px-4 py-3 text-center"
                        >
                          <input
                            type="checkbox"
                            checked={
                              permissions[
                                selectedRole
                              ]?.[module]?.[
                                permission
                              ] ?? false
                            }
                            onChange={() =>
                              togglePermission(
                                module,
                                permission
                              )
                            }
                            className="h-4 w-4 cursor-pointer"
                          />
                        </td>
                      )
                    )}

                  </tr>
                ))}

              </tbody>

            </table>

          </div>

          <div className="flex justify-end gap-3 border-t p-4">

            <button
              type="button"
              onClick={handleResetPermissions}
              className="rounded-md border px-4 py-2 text-sm hover:bg-muted"
            >
              Reset
            </button>

            <button
              type="button"
              onClick={handleSavePermissions}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Save Permissions
            </button>

          </div>

        </div>

      </div>
      {/* =====================================
          ADD ROLE MODAL
      ====================================== */}

      {showAddRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="w-full max-w-lg rounded-xl border bg-background p-6 shadow-xl">

            {/* Modal Header */}
            <div className="mb-6 flex items-start justify-between">

              <div>
                <h2 className="text-xl font-semibold">
                  Add New Role
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Create a new role and configure
                  its basic details.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowAddRole(false);
                  setNewRole("");
                  setRoleDescription("");
                  setRoleStatus("Active");
                }}
                className="text-2xl leading-none text-muted-foreground hover:text-foreground"
              >
                ×
              </button>

            </div>

            {/* Form */}
            <div className="space-y-5">

              {/* Role Name */}
              <div className="space-y-2">

                <label className="text-sm font-medium">
                  Role Name{" "}
                  <span className="text-red-500">
                    *
                  </span>
                </label>

                <input
                  autoFocus
                  value={newRole}
                  onChange={(e) =>
                    setNewRole(e.target.value)
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAddRole();
                    }
                  }}
                  placeholder="e.g. HR Manager"
                  className="w-full rounded-md border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
                />

              </div>

              {/* Description */}
              <div className="space-y-2">

                <label className="text-sm font-medium">
                  Description
                </label>

                <textarea
                  value={roleDescription}
                  onChange={(e) =>
                    setRoleDescription(e.target.value)
                  }
                  placeholder="Enter role description..."
                  rows={4}
                  className="w-full resize-none rounded-md border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
                />

              </div>

              {/* Status */}
              <div className="space-y-2">

                <label className="text-sm font-medium">
                  Status
                </label>

                <select
                  value={roleStatus}
                  onChange={(e) =>
                    setRoleStatus(
                      e.target.value as RoleStatus
                    )
                  }
                  className="w-full rounded-md border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
                >

                  <option value="Active">
                    Active
                  </option>

                  <option value="Inactive">
                    Inactive
                  </option>

                </select>

              </div>

            </div>

            {/* Modal Footer */}
            <div className="mt-7 flex justify-end gap-3">

              <button
                type="button"
                onClick={() => {
                  setShowAddRole(false);
                  setNewRole("");
                  setRoleDescription("");
                  setRoleStatus("Active");
                }}
                className="rounded-md border px-4 py-2 text-sm hover:bg-muted"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleAddRole}
                className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                Save Role
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}