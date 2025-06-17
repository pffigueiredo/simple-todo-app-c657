
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { Pencil, Trash2, Plus, CheckCircle, Circle } from 'lucide-react';
import type { Todo, CreateTodoInput, UpdateTodoInput } from '../../server/src/schema';

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Form state for creating new todos
  const [createFormData, setCreateFormData] = useState<CreateTodoInput>({
    title: '',
    description: null
  });

  // Form state for editing todos
  const [editFormData, setEditFormData] = useState<UpdateTodoInput>({
    id: 0,
    title: '',
    description: null
  });

  // Load todos on component mount
  const loadTodos = useCallback(async () => {
    try {
      const result = await trpc.getTodos.query();
      setTodos(result);
    } catch (error) {
      console.error('Failed to load todos:', error);
    }
  }, []);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  // Create a new todo
  const handleCreateTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createFormData.title.trim()) return;

    setIsLoading(true);
    try {
      const newTodo = await trpc.createTodo.mutate(createFormData);
      setTodos((prev: Todo[]) => [...prev, newTodo]);
      setCreateFormData({ title: '', description: null });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create todo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle todo completion status
  const handleToggleTodo = async (todoId: number) => {
    try {
      const updatedTodo = await trpc.toggleTodo.mutate({ id: todoId });
      setTodos((prev: Todo[]) =>
        prev.map((todo: Todo) => (todo.id === todoId ? updatedTodo : todo))
      );
    } catch (error) {
      console.error('Failed to toggle todo:', error);
    }
  };

  // Start editing a todo
  const handleStartEdit = (todo: Todo) => {
    setEditFormData({
      id: todo.id,
      title: todo.title,
      description: todo.description
    });
    setIsEditDialogOpen(true);
  };

  // Update an existing todo
  const handleUpdateTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData.title?.trim()) return;

    setIsLoading(true);
    try {
      const updatedTodo = await trpc.updateTodo.mutate(editFormData);
      setTodos((prev: Todo[]) =>
        prev.map((todo: Todo) => (todo.id === editFormData.id ? updatedTodo : todo))
      );
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Failed to update todo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a todo
  const handleDeleteTodo = async (todoId: number) => {
    try {
      await trpc.deleteTodo.mutate({ id: todoId });
      setTodos((prev: Todo[]) => prev.filter((todo: Todo) => todo.id !== todoId));
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  };

  // Calculate stats
  const completedCount = todos.filter((todo: Todo) => todo.completed).length;
  const totalCount = todos.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">✨ Todo Manager</h1>
          <p className="text-gray-600">Stay organized and get things done!</p>
          
          {/* Stats */}
          <div className="flex justify-center gap-4 mt-4">
            <Badge variant="secondary" className="text-sm">
              📋 {totalCount} Total
            </Badge>
            <Badge variant="default" className="text-sm bg-green-500">
              ✅ {completedCount} Completed
            </Badge>
            <Badge variant="outline" className="text-sm">
              🔄 {totalCount - completedCount} Remaining
            </Badge>
          </div>
        </div>

        {/* Create Todo Button */}
        <div className="mb-6 flex justify-center">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-5 h-5 mr-2" />
                Add New Todo
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>✨ Create New Todo</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateTodo} className="space-y-4">
                <div>
                  <Input
                    placeholder="What needs to be done?"
                    value={createFormData.title}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCreateFormData((prev: CreateTodoInput) => ({ ...prev, title: e.target.value }))
                    }
                    required
                    className="text-base"
                  />
                </div>
                <div>
                  <Textarea
                    placeholder="Add a description (optional)"
                    value={createFormData.description || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setCreateFormData((prev: CreateTodoInput) => ({
                        ...prev,
                        description: e.target.value || null
                      }))
                    }
                    rows={3}
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={isLoading} className="flex-1">
                    {isLoading ? 'Creating...' : '✨ Create Todo'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Todos List */}
        {todos.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-6xl mb-4">📝</div>
              <CardTitle className="mb-2">No todos yet!</CardTitle>
              <CardDescription>
                Create your first todo to get started on your productivity journey.
              </CardDescription>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {todos.map((todo: Todo) => (
              <Card key={todo.id} className={`transition-all duration-200 hover:shadow-lg ${
                todo.completed ? 'bg-green-50 border-green-200' : 'bg-white'
              }`}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <button
                      onClick={() => handleToggleTodo(todo.id)}
                      className="flex-shrink-0 mt-1 hover:scale-110 transition-transform"
                    >
                      {todo.completed ? (
                        <CheckCircle className="w-6 h-6 text-green-500" />
                      ) : (
                        <Circle className="w-6 h-6 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-lg font-semibold mb-1 ${
                        todo.completed ? 'line-through text-gray-500' : 'text-gray-800'
                      }`}>
                        {todo.title}
                      </h3>
                      
                      {todo.description && (
                        <p className={`text-sm mb-3 ${
                          todo.completed ? 'line-through text-gray-400' : 'text-gray-600'
                        }`}>
                          {todo.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span>Created: {todo.created_at.toLocaleDateString()}</span>
                        {todo.updated_at.getTime() !== todo.created_at.getTime() && (
                          <span>Updated: {todo.updated_at.toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStartEdit(todo)}
                        className="hover:bg-blue-50"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="hover:bg-red-50 hover:border-red-200">
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Todo</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{todo.title}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteTodo(todo.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>✏️ Edit Todo</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateTodo} className="space-y-4">
              <div>
                <Input
                  placeholder="Todo title"
                  value={editFormData.title || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditFormData((prev: UpdateTodoInput) => ({ ...prev, title: e.target.value }))
                  }
                  required
                  className="text-base"
                />
              </div>
              <div>
                <Textarea
                  placeholder="Description (optional)"
                  value={editFormData.description || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setEditFormData((prev: UpdateTodoInput) => ({
                      ...prev,
                      description: e.target.value || null
                    }))
                  }
                  rows={3}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? 'Updating...' : '💾 Update Todo'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default App;
