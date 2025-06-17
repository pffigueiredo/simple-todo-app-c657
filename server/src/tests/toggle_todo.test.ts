
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type ToggleTodoInput } from '../schema';
import { toggleTodo } from '../handlers/toggle_todo';
import { eq } from 'drizzle-orm';

describe('toggleTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should toggle todo from false to true', async () => {
    // Create a todo with completed = false
    const createResult = await db.insert(todosTable)
      .values({
        title: 'Test Todo',
        description: 'A todo for testing',
        completed: false
      })
      .returning()
      .execute();

    const todoId = createResult[0].id;
    const input: ToggleTodoInput = { id: todoId };

    const result = await toggleTodo(input);

    expect(result.id).toEqual(todoId);
    expect(result.title).toEqual('Test Todo');
    expect(result.description).toEqual('A todo for testing');
    expect(result.completed).toBe(true);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should toggle todo from true to false', async () => {
    // Create a todo with completed = true
    const createResult = await db.insert(todosTable)
      .values({
        title: 'Completed Todo',
        description: null,
        completed: true
      })
      .returning()
      .execute();

    const todoId = createResult[0].id;
    const input: ToggleTodoInput = { id: todoId };

    const result = await toggleTodo(input);

    expect(result.id).toEqual(todoId);
    expect(result.title).toEqual('Completed Todo');
    expect(result.description).toBeNull();
    expect(result.completed).toBe(false);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update the todo in database', async () => {
    // Create a todo
    const createResult = await db.insert(todosTable)
      .values({
        title: 'Database Test Todo',
        description: 'Test database update',
        completed: false
      })
      .returning()
      .execute();

    const todoId = createResult[0].id;
    const input: ToggleTodoInput = { id: todoId };

    await toggleTodo(input);

    // Verify the database was updated
    const updatedTodos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, todoId))
      .execute();

    expect(updatedTodos).toHaveLength(1);
    expect(updatedTodos[0].completed).toBe(true);
    expect(updatedTodos[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent todo', async () => {
    const input: ToggleTodoInput = { id: 999 };

    expect(toggleTodo(input)).rejects.toThrow(/Todo with id 999 not found/i);
  });

  it('should update updated_at timestamp', async () => {
    // Create a todo
    const createResult = await db.insert(todosTable)
      .values({
        title: 'Timestamp Test Todo',
        description: 'Test timestamp update',
        completed: false
      })
      .returning()
      .execute();

    const todoId = createResult[0].id;
    const originalUpdatedAt = createResult[0].updated_at;
    
    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const input: ToggleTodoInput = { id: todoId };
    const result = await toggleTodo(input);

    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });
});
