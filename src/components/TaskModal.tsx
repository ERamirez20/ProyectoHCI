import { useState } from 'react';
import { CheckCircle2, RotateCcw, Trash2 } from 'lucide-react';
import type { Task, TaskInput } from '../types';
import Modal from './Modal';
import TaskForm from './TaskForm';

interface TaskModalProps {
  task: Task;
  onSave: (values: TaskInput) => void;
  onToggleDone: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export default function TaskModal({ task, onSave, onToggleDone, onDelete, onClose }: TaskModalProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <Modal title="Editar tarea" onClose={onClose}>
      <TaskForm
        key={task.id}
        initial={{ title: task.title, date: task.date, time: task.time, alarm: task.alarm }}
        submitLabel="Guardar"
        onSubmit={onSave}
        onCancel={onClose}
      >
        <div className="task-actions">
          <button type="button" className="btn btn-secondary btn-block" onClick={onToggleDone}>
            {task.done ? <RotateCcw size={18} /> : <CheckCircle2 size={18} />}
            {task.done ? 'Marcar como pendiente' : 'Marcar como completada'}
          </button>
          {confirmDelete ? (
            <div className="confirm-inline">
              <span>¿Eliminar esta tarea?</span>
              <button type="button" className="btn btn-secondary" onClick={() => setConfirmDelete(false)}>
                No
              </button>
              <button type="button" className="btn btn-danger" onClick={onDelete}>
                Eliminar
              </button>
            </div>
          ) : (
            <button type="button" className="btn btn-ghost-danger btn-block" onClick={() => setConfirmDelete(true)}>
              <Trash2 size={18} />
              Eliminar tarea
            </button>
          )}
        </div>
      </TaskForm>
    </Modal>
  );
}
