import { createFileRoute } from '@tanstack/react-router'
import { getItemsFn } from '@/server/items'
import { getProjectsFn } from '@/server/projects'
import { getTasksFn } from '@/server/tasks'
import { getUsersFn } from '@/server/users'
import { AnalyticsView } from '@/components/analytics/AnalyticsView'

export const Route = createFileRoute('/_authenticated/analytics')({
  loader: async () => {
    const [items, projects, tasks, users] = await Promise.all([
      getItemsFn(),
      getProjectsFn(),
      getTasksFn(),
      getUsersFn(),
    ])
    return { items, projects, tasks, users }
  },
  component: AnalyticsPage,
})

function AnalyticsPage() {
  const { items, projects, tasks, users } = Route.useLoaderData()
  return <AnalyticsView items={items} projects={projects} tasks={tasks} users={users} />
}
