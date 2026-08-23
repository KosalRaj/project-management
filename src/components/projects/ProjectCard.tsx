import { Link } from '@tanstack/react-router'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Menu,
  MenuTrigger,
  MenuPopup,
  MenuItem,
  MenuSeparator,
} from '@/components/ui/menu'
import type { ProjectWithStats } from '@/server/projects'
import type { ProjectHealth } from '@/db/schema'
import {
  PROJECT_HEALTH_CONFIG,
  PROJECT_COLOR_MAP,
  PROJECT_ICONS,
} from '@/components/tasks/types'
import {
  MoreHorizontal,
  CheckCircle2,
  Folder,
  Edit,
  Trash2,
  ArrowRight,
} from 'lucide-react'

interface ProjectCardProps {
  project: ProjectWithStats
  onEdit: (project: ProjectWithStats) => void
  onDelete: (project: ProjectWithStats) => void
  isAdmin?: boolean
}

export function ProjectCard({ project, onEdit, onDelete, isAdmin = false }: ProjectCardProps) {
  const healthCfg = PROJECT_HEALTH_CONFIG[project.health as ProjectHealth] || PROJECT_HEALTH_CONFIG.on_track
  const colorCfg = PROJECT_COLOR_MAP[project.color] || PROJECT_COLOR_MAP.sky
  const IconComp = PROJECT_ICONS[project.icon] || Folder

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-border/70 bg-card/85 p-5 shadow-xs backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md">
      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className={`flex size-10 items-center justify-center rounded-xl ${colorCfg.bg} ${colorCfg.text} ${colorCfg.border} border`}>
              <IconComp className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border/60">
                  {project.key}
                </span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${healthCfg.bg} ${healthCfg.color} ${healthCfg.border}`}>
                  <span className={`size-1.5 rounded-full ${healthCfg.dot}`} />
                  {healthCfg.label}
                </span>
              </div>
              <Link
                to="/projects/$projectId"
                params={{ projectId: project.id }}
                className="font-bold text-sm text-foreground hover:text-primary transition-colors line-clamp-1 mt-0.5 group-hover:text-primary"
              >
                {project.name}
              </Link>
            </div>
          </div>

          <Menu>
            <MenuTrigger
              render={
                <Button
                  size="icon-xs"
                  variant="ghost"
                  className="size-7 text-muted-foreground opacity-60 group-hover:opacity-100"
                />
              }
            >
              <MoreHorizontal className="size-4" />
            </MenuTrigger>
            <MenuPopup align="end" className="w-36">
              <MenuItem onClick={() => onEdit(project)} className="gap-2 text-xs">
                <Edit className="size-3.5" /> Edit Project
              </MenuItem>
              {isAdmin && (
                <>
                  <MenuSeparator />
                  <MenuItem
                    onClick={() => onDelete(project)}
                    className="gap-2 text-xs text-destructive focus:bg-destructive/10"
                  >
                    <Trash2 className="size-3.5" /> Delete
                  </MenuItem>
                </>
              )}
            </MenuPopup>
          </Menu>
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-4">
          {project.description || 'No project description provided.'}
        </p>
      </div>

      {/* Bottom Section: Progress & Lead */}
      <div className="space-y-4 pt-2 border-t border-border/40">
        {/* Progress Bar & Task Counts */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground flex items-center gap-1">
              <CheckCircle2 className="size-3.5 text-emerald-500" />
              {project.completedTasks} of {project.totalTasks} tasks done
            </span>
            <span className="font-bold text-foreground">{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-1.5 w-full" />
        </div>

        {/* Lead & Link Button */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <Avatar className="size-6 border border-border">
              <AvatarImage src={project.leadAvatar || undefined} />
              <AvatarFallback className="text-[10px]">
                {project.leadName ? project.leadName[0] : 'U'}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground font-medium truncate max-w-[120px]">
              {project.leadName || 'Unassigned'}
            </span>
          </div>

          <Link
            to="/projects/$projectId"
            params={{ projectId: project.id }}
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer"
          >
            Open Board <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
