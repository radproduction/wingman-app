import { useMemo, useState } from 'react';
import { api } from '../lib/api';
import { useAsync } from '../lib/useAsync';
import { fmtDay, relativeDays } from '../lib/format';
import { PageHeader, Loading, DemoBadge, EmptyState } from '../components/ui';
import { CheckCircleIcon, CheckIcon } from '../components/icons';
import SwipeableRow from '../components/SwipeableRow';
import PullToRefresh from '../components/PullToRefresh';
import type { Task } from '../types';

const PRIORITY_COLOR = ['bg-gray', 'bg-danger', 'bg-warning', 'bg-accent', 'bg-gray'];

export default function Tasks() {
  const { data, loading, refresh, setData } = useAsync(() => api.tasks(), []);
  const [completing, setCompleting] = useState<Set<string>>(new Set());

  const groups = useMemo(() => {
    const tasks = data?.tasks ?? [];
    const now = Date.now();
    const overdue: Task[] = [];
    const todo: Task[] = [];
    const done: Task[] = [];
    for (const t of tasks) {
      if (t.completed) done.push(t);
      else if (t.due_date && new Date(t.due_date).getTime() < now) overdue.push(t);
      else todo.push(t);
    }
    return { overdue, todo, done };
  }, [data]);

  async function complete(t: Task) {
    setCompleting((s) => new Set(s).add(t.id));
    // optimistic update
    setData((d) => d ? { ...d, tasks: d.tasks.map((x) => x.id === t.id ? { ...x, completed: true } : x) } : d);
    try { await api.completeTask(t.id); } catch { /* keep optimistic */ }
  }

  if (loading || !data) return <Loading />;

  const pending = groups.overdue.length + groups.todo.length;

  return (
    <PullToRefresh onRefresh={refresh}>
      <PageHeader title="Tasks" subtitle={`${pending} pending · ${groups.done.length} done`} right={<DemoBadge show={data.mock} />} />

      <div className="px-4">
        {pending === 0 && groups.done.length === 0 && (
          <EmptyState icon={<CheckIcon className="w-10 h-10 text-gray/40" />} text="No tasks yet." />
        )}

        <Group title="Overdue" tone="text-danger" tasks={groups.overdue} onComplete={complete} completing={completing} />
        <Group title="To Do" tone="text-white" tasks={groups.todo} onComplete={complete} completing={completing} />
        <Group title="Completed" tone="text-gray" tasks={groups.done} onComplete={complete} completing={completing} done />
      </div>
      <p className="text-caption text-gray text-center mt-3">Swipe a task left to complete it</p>
      <div className="h-4" />
    </PullToRefresh>
  );
}

function Group({
  title, tone, tasks, onComplete, completing, done = false,
}: {
  title: string; tone: string; tasks: Task[]; onComplete: (t: Task) => void; completing: Set<string>; done?: boolean;
}) {
  if (tasks.length === 0) return null;
  return (
    <div>
      <div className="flex items-center gap-2 mt-5 mb-2 px-1">
        <h3 className={`text-caption uppercase tracking-wide font-semibold ${tone}`}>{title}</h3>
        <span className="text-caption text-gray">({tasks.length})</span>
      </div>
      <div className="flex flex-col gap-2.5">
        {tasks.map((t) => (
          <SwipeableRow key={t.id} onSwipe={() => onComplete(t)} actionLabel="Done" disabled={done}>
            <TaskCard task={t} done={done || completing.has(t.id)} onTapCheck={() => !done && onComplete(t)} />
          </SwipeableRow>
        ))}
      </div>
    </div>
  );
}

function TaskCard({ task, done, onTapCheck }: { task: Task; done: boolean; onTapCheck: () => void }) {
  return (
    <div className="card flex items-center gap-3 min-h-[60px]">
      <button onClick={onTapCheck} className="shrink-0 w-11 h-11 -my-2 -ml-2 flex items-center justify-center">
        {done
          ? <CheckCircleIcon className="w-6 h-6 text-success" />
          : <span className="w-5 h-5 rounded-full border-2 border-gray block" />}
      </button>
      <div className={`w-1 self-stretch rounded-full ${PRIORITY_COLOR[task.priority] ?? 'bg-gray'}`} />
      <div className="flex-1 min-w-0">
        <p className={`text-body ${done ? 'text-gray line-through' : 'text-white'} truncate`}>{task.title}</p>
        <p className="text-caption text-gray mt-0.5">
          {task.due_date ? `Due ${relativeDays(task.due_date)} · ${fmtDay(task.due_date)}` : 'No due date'}
          {task.source && task.source !== 'manual' ? ` · from ${task.source}` : ''}
        </p>
      </div>
    </div>
  );
}
