import { createFileRoute } from '@tanstack/react-router'
import { getItemsFn } from '@/server/items'
import { getUsersFn } from '@/server/users'
import { AnalyticsView } from '@/components/analytics/AnalyticsView'

export const Route = createFileRoute('/_authenticated/analytics')({
  loader: async () => {
    const [items, users] = await Promise.all([getItemsFn(), getUsersFn()])
    return { items, users }
  },
  component: AnalyticsPage,
})

function AnalyticsPage() {
  const { items, users } = Route.useLoaderData()
  return <AnalyticsView items={items} users={users} />
}
