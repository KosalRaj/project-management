import type { Task, Project } from '@/db/schema'

/**
 * Trigger a browser download of a given string content
 */
function downloadFile(content: string, filename: string, mimeType: string) {
  if (typeof window === 'undefined') return
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Escapes a field value for CSV format
 */
function escapeCsvCell(val: any): string {
  if (val === null || val === undefined) return '""'
  const str = String(val).replace(/"/g, '""')
  return `"${str}"`
}

/**
 * Export tasks array to a CSV file
 */
export function exportTasksToCsv(tasks: Task[], projects: Project[] = [], filename = 'tasks-export.csv') {
  const projectMap = new Map<string, string>()
  projects.forEach((p) => projectMap.set(p.id, p.name))

  const headers = [
    'Task Key',
    'Title',
    'Project',
    'Status',
    'Priority',
    'Type',
    'Story Points',
    'Assignee',
    'Due Date',
    'Created At',
  ]

  const rows = tasks.map((t) => [
    escapeCsvCell(t.taskKey),
    escapeCsvCell(t.title),
    escapeCsvCell(projectMap.get(t.projectId) || t.projectId),
    escapeCsvCell(t.status),
    escapeCsvCell(t.priority),
    escapeCsvCell(t.type),
    escapeCsvCell(t.estimatePoints ?? ''),
    escapeCsvCell(t.assigneeName || 'Unassigned'),
    escapeCsvCell(t.dueDate || ''),
    escapeCsvCell(t.createdAt || ''),
  ])

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
  downloadFile(csvContent, filename, 'text/csv;charset=utf-8;')
}

/**
 * Export tasks array to structured JSON backup
 */
export function exportTasksToJson(tasks: Task[], filename = 'tasks-backup.json') {
  const jsonContent = JSON.stringify(tasks, null, 2)
  downloadFile(jsonContent, filename, 'application/json;charset=utf-8;')
}

/**
 * Export projects array to CSV file
 */
export function exportProjectsToCsv(projects: any[], filename = 'projects-export.csv') {
  const headers = [
    'Key',
    'Project Name',
    'Status',
    'Health',
    'Budget ($)',
    'Lead',
    'Start Date',
    'Target Date',
    'Total Tasks',
    'Progress (%)',
  ]

  const rows = projects.map((p) => [
    escapeCsvCell(p.key),
    escapeCsvCell(p.name),
    escapeCsvCell(p.status),
    escapeCsvCell(p.health),
    escapeCsvCell(p.budget || 0),
    escapeCsvCell(p.leadName || 'Unassigned'),
    escapeCsvCell(p.startDate || ''),
    escapeCsvCell(p.targetDate || ''),
    escapeCsvCell(p.totalTasks ?? ''),
    escapeCsvCell(p.progress ?? ''),
  ])

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
  downloadFile(csvContent, filename, 'text/csv;charset=utf-8;')
}
