// projects.tsx

import { createFileRoute } from "@tanstack/react-router";

import {
  ArrowRight,
  Building2,
  CalendarDays,
  MapPin,
  Plus,
  Search,
  Users,
  Pencil,
  Trash2,
  Eye,
  X,
  RefreshCw,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { AppShell } from "@/components/erp/AppShell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";


// ======================================================
// ROUTE
// ======================================================

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      {
        title: "Projects & Sites | Payal Decor ERP",
      },
      {
        name: "description",
        content:
          "Manage modular furniture projects, client sites, measurement status, commercial value and delivery progress.",
      },
      {
        property: "og:title",
        content:
          "Projects & Sites | Payal Decor ERP",
      },
      {
        property: "og:description",
        content:
          "Manage every furniture project from site measurement to installation.",
      },
    ],
  }),

  component: Projects,
});


// ======================================================
// API
// ======================================================

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5001/api";


// ======================================================
// TYPES
// ======================================================

type ProjectStatus =
  | "All"
  | "InProgress"
  | "Pending"
  | "Completed";


type Project = {
  id: string;

  name: string;

  customer: string;

  site?: string | null;

  projectLead?: string | null;

  measuredArea?: string | null;

  targetDate?: string | null;

  progress: number;

  value: number | string;

  status:
    | "InProgress"
    | "Pending"
    | "Completed";

  notes?: string | null;

  createdAt?: string;

  updatedAt?: string;
};


type ProjectForm = {
  name: string;

  customer: string;

  site: string;

  projectLead: string;

  measuredArea: string;

  targetDate: string;

  progress: string;

  value: string;

  status:
    | "InProgress"
    | "Pending"
    | "Completed";

  notes: string;
};


// ======================================================
// EMPTY FORM
// ======================================================

const emptyForm: ProjectForm = {
  name: "",

  customer: "",

  site: "",

  projectLead: "",

  measuredArea: "",

  targetDate: "",

  progress: "0",

  value: "",

  status: "InProgress",

  notes: "",
};


// ======================================================
// PROJECTS COMPONENT
// ======================================================

function Projects() {

  // ====================================================
  // STATE
  // ====================================================

  const [projects, setProjects] =
    useState<Project[]>([]);

  const [status, setStatus] =
    useState<ProjectStatus>("All");

  const [query, setQuery] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);


  // ====================================================
  // MODALS
  // ====================================================

  const [showForm, setShowForm] =
    useState(false);

  const [showView, setShowView] =
    useState(false);

  const [showDelete, setShowDelete] =
    useState(false);


  // ====================================================
  // SELECTED PROJECT
  // ====================================================

  const [editingProject, setEditingProject] =
    useState<Project | null>(null);

  const [viewingProject, setViewingProject] =
    useState<Project | null>(null);

  const [deletingProject, setDeletingProject] =
    useState<Project | null>(null);


  // ====================================================
  // FORM
  // ====================================================

  const [form, setForm] =
    useState<ProjectForm>(emptyForm);


  // ====================================================
  // LOAD PROJECTS
  // ====================================================

  async function loadProjects() {

    try {

      setLoading(true);

      const response =
        await fetch(
          `${API_URL}/projects`
        );

      const data =
        await response.json();

      if (!response.ok) {

        throw new Error(
          data.message ||
            "Failed to load projects"
        );

      }

      setProjects(
        data.projects || []
      );

    } catch (error) {

      console.error(
        "❌ Error loading projects:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Unable to load projects from database."
      );

    } finally {

      setLoading(false);

    }
  }


  // ====================================================
  // INITIAL LOAD
  // ====================================================

  useEffect(() => {

    loadProjects();

  }, []);


  // ====================================================
  // FILTER PROJECTS
  // ====================================================

  const filtered =
    useMemo(() => {

      const search =
        query
          .trim()
          .toLowerCase();

      return projects.filter(
        (project) => {

          const matchesStatus =
            status === "All" ||
            project.status === status;

          const searchText = `
            ${project.name}
            ${project.customer}
            ${project.site || ""}
            ${project.projectLead || ""}
            ${project.measuredArea || ""}
          `.toLowerCase();

          const matchesSearch =
            !search ||
            searchText.includes(search);

          return (
            matchesStatus &&
            matchesSearch
          );
        }
      );

    }, [
      projects,
      query,
      status,
    ]);


  // ====================================================
  // ADD PROJECT
  // ====================================================

  function openAddProject() {

    setEditingProject(null);

    setForm({
      ...emptyForm,
    });

    setShowForm(true);
  }


  // ====================================================
  // EDIT PROJECT
  // ====================================================

  function openEdit(
    project: Project
  ) {

    setEditingProject(project);

    setForm({

      name:
        project.name || "",

      customer:
        project.customer || "",

      site:
        project.site || "",

      projectLead:
        project.projectLead || "",

      measuredArea:
        project.measuredArea || "",

      targetDate:
        project.targetDate || "",

      progress:
        String(
          project.progress ?? 0
        ),

      value:
        String(
          project.value ?? ""
        ),

      status:
        project.status,

      notes:
        project.notes || "",
    });

    setShowForm(true);
  }


  // ====================================================
  // SAVE PROJECT
  // ====================================================

  async function saveProject() {

    // --------------------------------------------------
    // VALIDATION
    // --------------------------------------------------

    if (!form.name.trim()) {

      alert(
        "Please enter project name."
      );

      return;
    }

    if (!form.customer.trim()) {

      alert(
        "Please enter customer name."
      );

      return;
    }


    try {

      setSaving(true);


      // ------------------------------------------------
      // PROGRESS VALIDATION
      // ------------------------------------------------

      let progress =
        Number(form.progress) || 0;

      if (progress < 0) {
        progress = 0;
      }

      if (progress > 100) {
        progress = 100;
      }


      // ------------------------------------------------
      // PAYLOAD
      // ------------------------------------------------

      const payload = {

        name:
          form.name.trim(),

        customer:
          form.customer.trim(),

        site:
          form.site.trim(),

        projectLead:
          form.projectLead.trim(),

        measuredArea:
          form.measuredArea.trim(),

        targetDate:
          form.targetDate.trim(),

        progress,

        value:
          Number(form.value) || 0,

        status:
          form.status,

        notes:
          form.notes.trim(),
      };


      // ------------------------------------------------
      // CREATE / UPDATE
      // ------------------------------------------------

      const url =
        editingProject
          ? `${API_URL}/projects/${editingProject.id}`
          : `${API_URL}/projects`;

      const method =
        editingProject
          ? "PUT"
          : "POST";


      const response =
        await fetch(url, {

          method,

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify(payload),

        });


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.message ||
            "Failed to save project"
        );
      }


      // ------------------------------------------------
      // SUCCESS
      // ------------------------------------------------

      alert(
        editingProject
          ? "Project updated successfully!"
          : "Project created successfully!"
      );


      // ------------------------------------------------
      // CLOSE
      // ------------------------------------------------

      setShowForm(false);

      setEditingProject(null);

      setForm({
        ...emptyForm,
      });


      // ------------------------------------------------
      // REFRESH
      // ------------------------------------------------

      await loadProjects();

    } catch (error) {

      console.error(
        "❌ Error saving project:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to save project."
      );

    } finally {

      setSaving(false);

    }
  }


  // ====================================================
  // DELETE PROJECT
  // ====================================================

  async function deleteProject() {

    if (!deletingProject) {
      return;
    }


    try {

      setDeleting(true);


      const response =
        await fetch(
          `${API_URL}/projects/${deletingProject.id}`,
          {
            method: "DELETE",
          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.message ||
            "Failed to delete project"
        );
      }


      alert(
        "Project deleted successfully!"
      );


      setShowDelete(false);

      setDeletingProject(null);


      await loadProjects();

    } catch (error) {

      console.error(
        "❌ Error deleting project:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to delete project."
      );

    } finally {

      setDeleting(false);

    }
  }


  // ====================================================
  // CLOSE FORM
  // ====================================================

  function closeForm() {

    if (saving) {
      return;
    }

    setShowForm(false);

    setEditingProject(null);

    setForm({
      ...emptyForm,
    });
  }


  // ====================================================
  // RENDER
  // ====================================================

  return (

    <AppShell title="Projects">

      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">

        <div>

          <p className="text-sm text-muted-foreground">
            Project workspace
          </p>

          <h2 className="text-2xl font-semibold">
            All projects
          </h2>

        </div>


        <Button
          onClick={openAddProject}
        >

          <Plus />

          New project

        </Button>

      </div>


      {/* ==================================================
          SEARCH + FILTER
      ================================================== */}

      <div className="mb-4 flex flex-wrap gap-2">

        <div className="flex min-w-64 flex-1 items-center gap-2 rounded-lg border border-input bg-card px-3 py-2 text-sm">

          <Search className="size-4 text-muted-foreground" />

          <input
            value={query}
            onChange={(e) =>
              setQuery(e.target.value)
            }
            placeholder="Search projects or clients..."
            className="w-full bg-transparent outline-none"
          />

        </div>


        {(
          [
            "All",
            "InProgress",
            "Pending",
            "Completed",
          ] as ProjectStatus[]
        ).map((item) => (

          <button
            key={item}
            onClick={() =>
              setStatus(item)
            }
            className={cn(

              "rounded-lg border px-3 py-2 text-sm",

              status === item
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card hover:bg-muted",

            )}
          >

            {item}

          </button>

        ))}


        <Button
          variant="outline"
          size="sm"
          onClick={loadProjects}
          disabled={loading}
        >

          <RefreshCw
            className={cn(
              loading &&
                "animate-spin"
            )}
          />

          Refresh

        </Button>

      </div>


      {/* ==================================================
          LOADING
      ================================================== */}

      {loading && (

        <div className="rounded-xl border border-dashed p-10 text-center">

          <RefreshCw className="mx-auto size-6 animate-spin text-primary" />

          <p className="mt-3 font-medium">
            Loading projects...
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            Fetching project data from PostgreSQL.
          </p>

        </div>

      )}


      {/* ==================================================
          PROJECT LIST
      ================================================== */}

      {!loading && (

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">

          {filtered.map(
            (project) => (

              <article
                key={project.id}
                className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]"
              >

                {/* ----------------------------------------
                    CARD HEADER
                ---------------------------------------- */}

                <div className="flex items-start justify-between gap-3">

                  <div>

                    <p className="text-xs text-muted-foreground">
                      {project.customer}
                    </p>

                    <h3 className="mt-1 text-base font-semibold">
                      {project.name}
                    </h3>

                  </div>


                  <Status
                    status={
                      project.status
                    }
                  />

                </div>


                {/* ----------------------------------------
                    PROJECT INFORMATION
                ---------------------------------------- */}

                <div className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">

                  <Info
                    icon={MapPin}
                    label="Site"
                    value={
                      project.site ||
                      "—"
                    }
                  />


                  <Info
                    icon={Users}
                    label="Project lead"
                    value={
                      project.projectLead ||
                      "—"
                    }
                  />


                  <Info
                    icon={Building2}
                    label="Measured area"
                    value={
                      project.measuredArea ||
                      "—"
                    }
                  />


                  <Info
                    icon={CalendarDays}
                    label="Target"
                    value={
                      project.targetDate ||
                      "—"
                    }
                  />

                </div>


                {/* ----------------------------------------
                    PROGRESS
                ---------------------------------------- */}

                <div className="mt-4 flex items-center gap-3">

                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">

                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{
                        width: `${Math.min(
                          Math.max(
                            Number(
                              project.progress ||
                                0
                            ),
                            0
                          ),
                          100
                        )}%`,
                      }}
                    />

                  </div>


                  <span className="tabular text-xs font-medium">

                    {project.progress || 0}%

                  </span>


                  <span className="ml-auto tabular text-sm font-semibold">

                    ₹
                    {Number(
                      project.value || 0
                    ).toLocaleString(
                      "en-IN"
                    )}

                  </span>

                </div>


                {/* ----------------------------------------
                    ACTIONS
                ---------------------------------------- */}

                <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3">

                  {/* VIEW */}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {

                      setViewingProject(
                        project
                      );

                      setShowView(true);

                    }}
                  >

                    <Eye />

                    View

                  </Button>


                  {/* EDIT */}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      openEdit(
                        project
                      )
                    }
                  >

                    <Pencil />

                    Edit

                  </Button>


                  {/* DELETE */}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {

                      setDeletingProject(
                        project
                      );

                      setShowDelete(true);

                    }}
                  >

                    <Trash2 />

                    Delete

                  </Button>

                </div>

              </article>

            )
          )}

        </div>

      )}


      {/* ==================================================
          NO PROJECTS
      ================================================== */}

      {!loading &&
        filtered.length === 0 && (

          <div className="rounded-xl border border-dashed p-10 text-center">

            <Building2 className="mx-auto size-8 text-muted-foreground" />

            <p className="mt-3 font-medium">
              No projects found
            </p>

            <p className="mt-1 text-sm text-muted-foreground">

              {projects.length === 0
                ? "No projects are available yet. Create a new project to get started."
                : "Try changing the search or filter."}

            </p>


            {projects.length === 0 && (

              <div className="mt-4">

                <Button
                  onClick={
                    openAddProject
                  }
                >

                  <Plus />

                  New project

                </Button>

              </div>

            )}

          </div>

        )}


      {/* ==================================================
          ADD / EDIT PROJECT DIALOG
      ================================================== */}

      {showForm && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border bg-background shadow-xl">

            {/* HEADER */}

            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background p-5">

              <div>

                <h3 className="text-lg font-semibold">

                  {editingProject
                    ? "Edit Project"
                    : "New Project"}

                </h3>

                <p className="text-sm text-muted-foreground">
                  Enter project and site information.
                </p>

              </div>


              <button
                onClick={closeForm}
                disabled={saving}
                className="rounded-md p-2 hover:bg-muted disabled:opacity-50"
              >

                <X className="size-5" />

              </button>

            </div>


            {/* FORM */}

            <div className="grid gap-4 p-5 md:grid-cols-2">

              <Field
                label="Project Name *"
                value={form.name}
                onChange={(value) =>
                  setForm({
                    ...form,
                    name: value,
                  })
                }
              />


              <Field
                label="Customer / Company *"
                value={form.customer}
                onChange={(value) =>
                  setForm({
                    ...form,
                    customer: value,
                  })
                }
              />


              <Field
                label="Site"
                value={form.site}
                onChange={(value) =>
                  setForm({
                    ...form,
                    site: value,
                  })
                }
              />


              <Field
                label="Project Lead"
                value={form.projectLead}
                onChange={(value) =>
                  setForm({
                    ...form,
                    projectLead: value,
                  })
                }
              />


              <Field
                label="Measured Area"
                value={
                  form.measuredArea
                }
                onChange={(value) =>
                  setForm({
                    ...form,
                    measuredArea:
                      value,
                  })
                }
                placeholder="Example: 28,400 sq.ft"
              />


              <Field
                label="Target Date"
                value={
                  form.targetDate
                }
                onChange={(value) =>
                  setForm({
                    ...form,
                    targetDate:
                      value,
                  })
                }
                placeholder="Example: 30 Jun 2025"
              />


              <Field
                label="Project Value"
                type="number"
                value={
                  form.value
                }
                onChange={(value) =>
                  setForm({
                    ...form,
                    value,
                  })
                }
              />


              <Field
                label="Progress (%)"
                type="number"
                value={
                  form.progress
                }
                onChange={(value) =>
                  setForm({
                    ...form,
                    progress:
                      value,
                  })
                }
              />


              {/* STATUS */}

              <div>

                <label className="mb-1.5 block text-sm font-medium">
                  Status
                </label>


                <select
                  value={
                    form.status
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      status:
                        e.target.value as
                          | "InProgress"
                          | "Pending"
                          | "Completed",
                    })
                  }
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                >

                  <option value="InProgress">
                    In Progress
                  </option>

                  <option value="Pending">
                    Pending
                  </option>

                  <option value="Completed">
                    Completed
                  </option>

                </select>

              </div>


              {/* NOTES */}

              <div className="md:col-span-2">

                <label className="mb-1.5 block text-sm font-medium">
                  Notes
                </label>


                <textarea
                  value={
                    form.notes
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      notes:
                        e.target.value,
                    })
                  }
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Additional project notes"
                />

              </div>

            </div>


            {/* FOOTER */}

            <div className="flex justify-end gap-2 border-t p-5">

              <Button
                variant="outline"
                onClick={closeForm}
                disabled={saving}
              >

                Cancel

              </Button>


              <Button
                onClick={
                  saveProject
                }
                disabled={saving}
              >

                {saving && (

                  <RefreshCw
                    className="animate-spin"
                  />

                )}


                {saving
                  ? "Saving..."
                  : editingProject
                    ? "Update Project"
                    : "Save Project"}

              </Button>

            </div>

          </div>

        </div>

      )}


      {/* ==================================================
          VIEW PROJECT
      ================================================== */}

      {showView &&
        viewingProject && (

          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border bg-background shadow-xl">

              {/* HEADER */}

              <div className="flex items-center justify-between border-b p-5">

                <div>

                  <h3 className="text-lg font-semibold">
                    Project Details
                  </h3>

                  <p className="text-sm text-muted-foreground">

                    {
                      viewingProject.customer
                    }

                  </p>

                </div>


                <button
                  onClick={() =>
                    setShowView(
                      false
                    )
                  }
                  className="rounded-md p-2 hover:bg-muted"
                >

                  <X className="size-5" />

                </button>

              </div>


              {/* DETAILS */}

              <div className="grid gap-4 p-5 md:grid-cols-2">

                <Detail
                  label="Project Name"
                  value={
                    viewingProject.name
                  }
                />


                <Detail
                  label="Customer"
                  value={
                    viewingProject.customer
                  }
                />


                <Detail
                  label="Site"
                  value={
                    viewingProject.site ||
                    "—"
                  }
                />


                <Detail
                  label="Project Lead"
                  value={
                    viewingProject.projectLead ||
                    "—"
                  }
                />


                <Detail
                  label="Measured Area"
                  value={
                    viewingProject.measuredArea ||
                    "—"
                  }
                />


                <Detail
                  label="Target Date"
                  value={
                    viewingProject.targetDate ||
                    "—"
                  }
                />


                <Detail
                  label="Project Value"
                  value={`₹${Number(
                    viewingProject.value ||
                      0
                  ).toLocaleString(
                    "en-IN"
                  )}`}
                />


                <Detail
                  label="Progress"
                  value={`${viewingProject.progress || 0}%`}
                />


                <Detail
                  label="Status"
                  value={
                    viewingProject.status
                  }
                />


                <div className="md:col-span-2">

                  <Detail
                    label="Notes"
                    value={
                      viewingProject.notes ||
                      "—"
                    }
                  />

                </div>

              </div>


              {/* FOOTER */}

              <div className="flex justify-end border-t p-5">

                <Button
                  onClick={() =>
                    setShowView(
                      false
                    )
                  }
                >

                  Close

                </Button>

              </div>

            </div>

          </div>

        )}


      {/* ==================================================
          DELETE CONFIRMATION
      ================================================== */}

      {showDelete &&
        deletingProject && (

          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

            <div className="w-full max-w-md rounded-xl border bg-background p-6 shadow-xl">

              <h3 className="text-lg font-semibold">
                Delete Project?
              </h3>


              <p className="mt-2 text-sm text-muted-foreground">

                Are you sure you want to delete{" "}

                <strong>
                  {
                    deletingProject.name
                  }
                </strong>

                ?

                <br />

                This action cannot be undone.

              </p>


              <div className="mt-6 flex justify-end gap-2">

                <Button
                  variant="outline"
                  onClick={() => {

                    setShowDelete(
                      false
                    );

                    setDeletingProject(
                      null
                    );

                  }}
                  disabled={deleting}
                >

                  Cancel

                </Button>


                <Button
                  variant="destructive"
                  onClick={
                    deleteProject
                  }
                  disabled={deleting}
                >

                  {deleting && (

                    <RefreshCw
                      className="animate-spin"
                    />

                  )}


                  {deleting
                    ? "Deleting..."
                    : "Delete"}

                </Button>

              </div>

            </div>

          </div>

        )}

    </AppShell>
  );
}


// ======================================================
// FIELD COMPONENT
// ======================================================

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;

  value: string;

  onChange: (
    value: string
  ) => void;

  type?: string;

  placeholder?: string;
}) {

  return (

    <div>

      <label className="mb-1.5 block text-sm font-medium">

        {label}

      </label>


      <input
        type={type}
        value={value}
        onChange={(e) =>
          onChange(
            e.target.value
          )
        }
        placeholder={
          placeholder
        }
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
      />

    </div>

  );
}


// ======================================================
// DETAIL COMPONENT
// ======================================================

function Detail({
  label,
  value,
}: {
  label: string;

  value: string;
}) {

  return (

    <div>

      <p className="text-xs text-muted-foreground">
        {label}
      </p>


      <p className="mt-1 break-words text-sm font-medium">
        {value}
      </p>

    </div>

  );
}


// ======================================================
// INFO COMPONENT
// ======================================================

function Info({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin;

  label: string;

  value: string;
}) {

  return (

    <div className="flex gap-2">

      <Icon className="mt-0.5 size-4 shrink-0 text-primary" />


      <div className="min-w-0">

        <p className="text-[11px] text-muted-foreground">
          {label}
        </p>


        <p className="truncate text-sm">
          {value}
        </p>

      </div>

    </div>

  );
}


// ======================================================
// STATUS COMPONENT
// ======================================================

function Status({
  status,
}: {
  status:
    | "InProgress"
    | "Pending"
    | "Completed";
}) {

  return (

    <span
      className={cn(

        "rounded-md px-2 py-1 text-xs font-medium",

        status === "Completed"
          ? "bg-success/15 text-success"

          : status === "Pending"
            ? "bg-warning/25 text-warning-foreground"

            : "bg-info/15 text-info"

      )}
    >

      {status}

    </span>

  );
}