
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type DeleteTodoInput } from '../schema';
import { deleteTodo } from '../handlers/delete_todo';
import { eq } from 'drizzle-orm';

// Test input
const testInput: DeleteTodoInput = {
  id: 1
};

describe('deleteTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing todo', async () => {
    // Create a todo first
    await db.insert(todosTable)
      .values({
        title: 'Test Todo',
        description: 'A todo for testing deletion'
      })
      .execute();

    const result = await deleteTodo(testInput);

    expect(result.success).toBe(true);

    // Verify the todo was actually deleted from database
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, testInput.id))
      .execute();

    expect(todos).toHaveLength(0);
  });

  it('should throw error when todo does not exist', async () => {
    // Try to delete a non-existent todo
    await expect(deleteTodo({ id: 999 })).rejects.toThrow(/todo with id 999 not found/i);
  });

  it('should delete correct todo when multiple exist', async () => {
    // Create multiple todos
    await db.insert(todosTable)
      .values([
        { title: 'Todo 1', description: 'First todo' },
        { title: 'Todo 2', description: 'Second todo' },
        { title: 'Todo 3', description: 'Third todo' }
      ])
      .execute();

    // Delete the second todo (id: 2)
    const result = await deleteTodo({ id: 2 });

    expect(result.success).toBe(true);

    // Verify only the correct todo was deleted
    const remainingTodos = await db.select()
      .from(todosTable)
      .execute();

    expect(remainingTodos).toHaveLength(2);
    expect(remainingTodos.some(todo => todo.id === 2)).toBe(false);
    expect(remainingTodos.some(todo => todo.id === 1)).toBe(true);
    expect(remainingTodos.some(todo => todo.id === 3)).toBe(true);
  });
});
