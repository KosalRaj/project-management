# Graph Report - /Volumes/Acasis2TB/playground/task-management  (2026-08-23)

## Corpus Check
- Corpus is ~43,575 words - fits in a single context window. You may not need a graph.

## Summary
- 604 nodes · 1440 edges · 75 communities (25 shown, 50 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 45 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Modal Dialogs & Item Forms|Modal Dialogs & Item Forms]]
- [[_COMMUNITY_UI Primitives & Styling|UI Primitives & Styling]]
- [[_COMMUNITY_Database Schema & Tables|Database Schema & Tables]]
- [[_COMMUNITY_Application Routing Structure|Application Routing Structure]]
- [[_COMMUNITY_Dashboard Layout & Item Views|Dashboard Layout & Item Views]]
- [[_COMMUNITY_Analytics & Batch Actions|Analytics & Batch Actions]]
- [[_COMMUNITY_Project & Task Workspace|Project & Task Workspace]]
- [[_COMMUNITY_Coss UI Component Primitives|Coss UI Component Primitives]]
- [[_COMMUNITY_Authentication & Security Primitives|Authentication & Security Primitives]]
- [[_COMMUNITY_Database Connection & Initialization|Database Connection & Initialization]]
- [[_COMMUNITY_Project Workspace Pages|Project Workspace Pages]]
- [[_COMMUNITY_User Management & Table Views|User Management & Table Views]]
- [[_COMMUNITY_Root Layout & Auth Context|Root Layout & Auth Context]]
- [[_COMMUNITY_Architecture Documentation & Agents|Architecture Documentation & Agents]]
- [[_COMMUNITY_Dashboard Item Views & Drawers|Dashboard Item Views & Drawers]]
- [[_COMMUNITY_Header, Footer & Error Views|Header, Footer & Error Views]]
- [[_COMMUNITY_Theme Toggling & Dark Mode|Theme Toggling & Dark Mode]]
- [[_COMMUNITY_User Modal & Presets|User Modal & Presets]]
- [[_COMMUNITY_User Filters & Sorting|User Filters & Sorting]]
- [[_COMMUNITY_Authentication State & Login Route|Authentication State & Login Route]]
- [[_COMMUNITY_Batch Item & Task Server Mutations|Batch Item & Task Server Mutations]]
- [[_COMMUNITY_Dashboard Filter & Stats State|Dashboard Filter & Stats State]]
- [[_COMMUNITY_Segmented Control Utility|Segmented Control Utility]]
- [[_COMMUNITY_Item & Project Server Creation|Item & Project Server Creation]]
- [[_COMMUNITY_Vite Build Configuration|Vite Build Configuration]]
- [[_COMMUNITY_About Page Route|About Page Route]]
- [[_COMMUNITY_Analytics Page Route|Analytics Page Route]]
- [[_COMMUNITY_Settings Page Route|Settings Page Route]]
- [[_COMMUNITY_Item Server Deletion|Item Server Deletion]]
- [[_COMMUNITY_Project & Task Server Deletion|Project & Task Server Deletion]]
- [[_COMMUNITY_User Server Management|User Server Management]]
- [[_COMMUNITY_PNPM Workspace Configuration|PNPM Workspace Configuration]]
- [[_COMMUNITY_Drizzle ORM Configuration|Drizzle ORM Configuration]]
- [[_COMMUNITY_Vite Configuration|Vite Configuration]]
- [[_COMMUNITY_DashboardHeader Component|DashboardHeader Component]]
- [[_COMMUNITY_AlertDialogPopup Component|AlertDialogPopup Component]]
- [[_COMMUNITY_AvatarImage Component|AvatarImage Component]]
- [[_COMMUNITY_AvatarFallback Component|AvatarFallback Component]]
- [[_COMMUNITY_Card Component|Card Component]]
- [[_COMMUNITY_CardHeader Component|CardHeader Component]]
- [[_COMMUNITY_CardContent Component|CardContent Component]]
- [[_COMMUNITY_CardFooter Component|CardFooter Component]]
- [[_COMMUNITY_MenuPopup Component|MenuPopup Component]]
- [[_COMMUNITY_MenuItem Component|MenuItem Component]]
- [[_COMMUNITY_ScrollBar Component|ScrollBar Component]]
- [[_COMMUNITY_SelectValue Component|SelectValue Component]]
- [[_COMMUNITY_SelectPopup Component|SelectPopup Component]]
- [[_COMMUNITY_SelectItem Component|SelectItem Component]]
- [[_COMMUNITY_Tabs Component|Tabs Component]]
- [[_COMMUNITY_TabsList Component|TabsList Component]]
- [[_COMMUNITY_TabsTab Component|TabsTab Component]]
- [[_COMMUNITY_TabsPanel Component|TabsPanel Component]]
- [[_COMMUNITY_Textarea Component|Textarea Component]]
- [[_COMMUNITY_Tooltip Component|Tooltip Component]]
- [[_COMMUNITY_TooltipTrigger Component|TooltipTrigger Component]]
- [[_COMMUNITY_TooltipPopup Component|TooltipPopup Component]]
- [[_COMMUNITY_AnimatedDigitGroup Component|AnimatedDigitGroup Component]]
- [[_COMMUNITY_SuccessCheckIcon Component|SuccessCheckIcon Component]]
- [[_COMMUNITY_NewItem Component|NewItem Component]]
- [[_COMMUNITY_NewUser Component|NewUser Component]]
- [[_COMMUNITY_NewSession Component|NewSession Component]]
- [[_COMMUNITY_NewProject Component|NewProject Component]]
- [[_COMMUNITY_ProjectStatus Component|ProjectStatus Component]]
- [[_COMMUNITY_NewTask Component|NewTask Component]]
- [[_COMMUNITY_TaskPriority Component|TaskPriority Component]]
- [[_COMMUNITY_TaskType Component|TaskType Component]]
- [[_COMMUNITY_segmentedControlRootClassName Component|segmentedControlRootClassName Component]]
- [[_COMMUNITY_cn Component|cn Component]]
- [[_COMMUNITY_getCurrentUserFn Component|getCurrentUserFn Component]]
- [[_COMMUNITY_getItemsFn Component|getItemsFn Component]]
- [[_COMMUNITY_updateProjectFn Component|updateProjectFn Component]]
- [[_COMMUNITY_getTaskByIdFn Component|getTaskByIdFn Component]]
- [[_COMMUNITY_addCommentToTaskFn Component|addCommentToTaskFn Component]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 76 edges
2. `Button()` - 30 edges
3. `Avatar()` - 15 edges
4. `AvatarImage()` - 15 edges
5. `AvatarFallback()` - 15 edges
6. `SelectTrigger()` - 15 edges
7. `Spinner()` - 15 edges
8. `Input()` - 14 edges
9. `SelectValue()` - 14 edges
10. `SelectPopup()` - 14 edges

## Surprising Connections (you probably didn't know these)
- `Remote-First Cross-Device State Synchronization` --semantically_similar_to--> `Unified Edge Database Synchronization Pattern`  [INFERRED] [semantically similar]
  docs/TURSO_GUIDE.md → README.md
- `LoginPage` --semantically_similar_to--> `UserModal`  [INFERRED] [semantically similar]
  src/routes/login.tsx → src/components/users/UserModal.tsx
- `db` --references--> `items table`  [INFERRED]
  src/db/index.ts → src/db/schema.ts
- `TanStack Start Agent Guidance` --conceptually_related_to--> `Fullstack TanStack Start + Turso + Drizzle + Cloudflare Architecture`  [INFERRED]
  AGENTS.md → README.md
- `SelectSeparator()` --calls--> `cn()`  [EXTRACTED]
  src/components/ui/select.tsx → src/lib/utils.ts

## Hyperedges (group relationships)
- **Dashboard Initiative Management System** — itemtableview_itemtableview, itemkanbanview_itemkanbanview, itemmodal_itemmodal, itemdetaildrawer_itemdetaildrawer, batchactionbar_batchactionbar, dashboardfilters_dashboardfilters [INFERRED 0.85]
- **Dashboard Status and Styling Configuration Pipeline** — types_status_config, types_priority_config, types_category_config, itemtableview_itemtableview, itemkanbanview_itemkanbanview, itemdetaildrawer_itemdetaildrawer [INFERRED 0.85]
- **TanStack Routing and Error Handling Pipeline** — router_getrouter, routetree_gen_routetree, errorviews_notfoundcomponent, errorviews_rooterrorcomponent [EXTRACTED 1.00]
- **Task Management Multi-View Presentation** — taskkanbanview_taskkanbanview, tasktableview_tasktableview, taskdetaildrawer_taskdetaildrawer [INFERRED 0.85]
- **Modal Form Creation with Error Shake Pattern** — projectmodal_projectmodal, taskmodal_taskmodal, transitions_useshakeerror [INFERRED 0.85]
- **Task and Project Status/Priority Token Configuration** — types_task_status_config, types_task_priority_config, types_task_type_config, types_project_health_config [INFERRED 0.95]
- **User Management Lifecycle** — users_userspage, userstableview_userstableview, usermodal_usermodal, deleteuserdialog_deleteuserdialog, usersfilters_usersfilters [INFERRED 0.95]
- **RBAC and Session Authentication Flow** — auth_context_authprovider, auth_context_useauth, login_loginpage, _authenticated_authenticatedlayout, schema_sessions, schema_users [INFERRED 0.95]
- **Project Task Execution Hierarchy** — schema_projects, schema_tasks, projects_projectspage, projects__projectid_projectworkspacepage, tasks_taskspage [INFERRED 0.95]
- **User Authentication & Session Lifecycle Flow** — auth_loginfn, auth_registerfn, auth_getcurrentuserfn, auth_logoutfn, crypto_generatesessiontoken [EXTRACTED 1.00]
- **Project and Task Hierarchical Lifecycle Management** — projects_getprojectsfn, projects_deleteprojectfn, tasks_gettasksfn, tasks_createtaskfn [INFERRED 0.85]
- **Turso & Cloudflare Edge Database Architecture** — turso_guide_architecture_overview, turso_guide_zero_native_binaries, turso_guide_cross_device_sync, readme_fullstack_architecture [EXTRACTED 1.00]

## Communities (75 total, 50 thin omitted)

### Community 0 - "Modal Dialogs & Item Forms"
Cohesion: 0.08
Nodes (50): CATEGORY_ITEMS, ItemModal(), ItemModalProps, PRIORITY_ITEMS, STATUS_ITEMS, Project, ProjectHealth, SafeUser (+42 more)

### Community 1 - "UI Primitives & Styling"
Cohesion: 0.06
Nodes (49): DeleteConfirmDialogProps, StatsOverview(), StatsOverviewProps, segmentedControlItemSizeClassNames, segmentedControlItemVariants, SegmentedControlSize, cn(), Route (+41 more)

### Community 2 - "Database Schema & Tables"
Cohesion: 0.07
Nodes (43): client, config, db, ensureTablesExist(), CommentItem, items, NewItem, NewProject (+35 more)

### Community 3 - "Application Routing Structure"
Cohesion: 0.05
Nodes (42): Route, Route, Route, Route, Route, TasksPage(), Route, UsersPage() (+34 more)

### Community 4 - "Dashboard Layout & Item Views"
Cohesion: 0.13
Nodes (29): DashboardHeader(), DashboardHeaderProps, ItemKanbanViewProps, KANBAN_COLUMNS, ItemTableViewProps, STATUS_OPTIONS, SubtaskItem, DashboardLayoutProps (+21 more)

### Community 5 - "Analytics & Batch Actions"
Cohesion: 0.08
Nodes (36): AnalyticsView(), AnalyticsViewProps, Route, BATCH_PRIORITY_OPTIONS, BATCH_STATUS_OPTIONS, BatchActionBar(), BatchActionBarProps, CATEGORY_ITEMS (+28 more)

### Community 6 - "Project & Task Workspace"
Cohesion: 0.1
Nodes (29): DeleteConfirmDialog(), projects, Task, tasks, TaskStatus, ProjectCard(), createProjectFn, deleteProjectFn (+21 more)

### Community 7 - "Coss UI Component Primitives"
Cohesion: 0.11
Nodes (33): AlertDialog, Avatar, Badge, badgeVariants, Button, buttonVariants, Checkbox, Dialog (+25 more)

### Community 8 - "Authentication & Security Primitives"
Cohesion: 0.12
Nodes (21): loginFn, logoutFn, registerFn, seedAuthAndUsersFn, SESSION_DURATION_MS, bufferToHex, generateSessionToken, hashPassword (+13 more)

### Community 9 - "Database Connection & Initialization"
Cohesion: 0.17
Nodes (15): client, db, ensureTablesExist, getDatabaseConfig, ProjectsPage, Projects Hub Route (/_authenticated/projects), CommentItem, Project (+7 more)

### Community 10 - "Project Workspace Pages"
Cohesion: 0.18
Nodes (14): DashboardPage, Dashboard Index Route (/_authenticated/), ProjectWorkspacePage, Project Workspace Route (/_authenticated/projects/$projectId), Item, ItemCategory, ItemPriority, items table (+6 more)

### Community 11 - "User Management & Table Views"
Cohesion: 0.23
Nodes (12): DeleteUserDialog, DeleteUserDialogProps, SafeUser, UserStatus, USER_STATUS_CONFIG, Users Route (/_authenticated/users), UsersPage, UsersStatsOverview (+4 more)

### Community 12 - "Root Layout & Auth Context"
Cohesion: 0.18
Nodes (11): RootDocument, Root Route, THEME_INIT_SCRIPT, AuthContextType, AuthProvider, deleteCookie, getCookie, getStoredToken (+3 more)

### Community 13 - "Architecture Documentation & Agents"
Cohesion: 0.2
Nodes (11): TanStack Devtools Agent Guidance, TanStack Router Agent Guidance, TanStack Start Agent Guidance, TanStack Intent Skills & Rules Configuration, Fullstack TanStack Start + Turso + Drizzle + Cloudflare Architecture, Project Quick Start & Scripts, Unified Edge Database Synchronization Pattern, Turso Edge & Dev Architecture Overview (+3 more)

### Community 14 - "Dashboard Item Views & Drawers"
Cohesion: 0.29
Nodes (10): BatchActionBar, DeleteConfirmDialog, ItemDetailDrawer, ItemKanbanView, ItemModal, ItemTableView, AVATAR_PRESETS, CATEGORY_CONFIG (+2 more)

### Community 15 - "Header, Footer & Error Views"
Cohesion: 0.2
Nodes (10): DashboardLayout, NotFoundComponent, RootErrorComponent, Footer, Header, getRouter, TanStack Router Register Module Augmentation, routeTree (+2 more)

### Community 17 - "User Modal & Presets"
Cohesion: 0.33
Nodes (6): USER_AVATAR_PRESETS, DEPARTMENT_PRESETS, ROLE_OPTIONS, STATUS_OPTIONS, UserModal, UserModalProps

### Community 18 - "User Filters & Sorting"
Cohesion: 0.33
Nodes (6): UserFilterState, ROLE_OPTIONS, SORT_OPTIONS, STATUS_OPTIONS, UsersFilters, UsersFiltersProps

### Community 19 - "Authentication State & Login Route"
Cohesion: 0.47
Nodes (6): AuthenticatedLayout, Authenticated Layout Route (/_authenticated), AuthContext, useAuth, LoginPage, Login Route (/login)

### Community 20 - "Batch Item & Task Server Mutations"
Cohesion: 0.4
Nodes (5): batchUpdateItemsFn, toggleItemFn, updateItemFn, batchUpdateTasksFn, updateTaskFn

### Community 21 - "Dashboard Filter & Stats State"
Cohesion: 0.5
Nodes (4): AnalyticsView, DashboardFilters, StatsOverview, FilterState

### Community 22 - "Segmented Control Utility"
Cohesion: 0.5
Nodes (4): segmentedControlItemLayoutClassName, segmentedControlItemSizeClassNames, segmentedControlItemVariants, SegmentedControlSize

### Community 23 - "Item & Project Server Creation"
Cohesion: 0.5
Nodes (4): createItemFn, duplicateItemFn, createProjectFn, createTaskFn

## Knowledge Gaps
- **207 isolated node(s):** `config`, `Register`, `AuthenticatedRoute`, `AboutRoute`, `LoginRoute` (+202 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **50 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `UI Primitives & Styling` to `Modal Dialogs & Item Forms`, `Dashboard Layout & Item Views`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Why does `Button()` connect `Dashboard Layout & Item Views` to `Modal Dialogs & Item Forms`, `UI Primitives & Styling`, `Database Schema & Tables`, `Application Routing Structure`, `Analytics & Batch Actions`, `Project & Task Workspace`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Why does `SafeUser` connect `User Management & Table Views` to `User Modal & Presets`, `Project Workspace Pages`, `Root Layout & Auth Context`, `Database Connection & Initialization`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._
- **What connects `config`, `Register`, `AuthenticatedRoute` to the rest of the system?**
  _207 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Modal Dialogs & Item Forms` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
- **Should `UI Primitives & Styling` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Database Schema & Tables` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._