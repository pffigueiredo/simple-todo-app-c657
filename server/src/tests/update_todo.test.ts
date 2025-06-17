
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type UpdateTodoInput, type CreateTodoInput } from '../schema';
import { updateTodo } from '../handlers/update_todo';
import { eq } from 'drizzle-orm';

// Helper to create a test todo
const createTestTodo = async (title: string = 'Test Todo', description: string | null = 'Test description') => {
  const result = await db.insert(todosTable)
    .values({
      title,
      description,
      completed: false
    })
    .returning()
    .execute();
  
  return result[0];
};

describe('updateTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update todo title', async () => {
    const testTodo = await createTestTodo();
    
    const updateInput: UpdateTodoInput = {
      id: testTodo.id,
      title: 'Updated Title'
    };

    const result = await updateTodo(updateInput);

    expect(result.id).toEqual(testTodo.id);
    expect(result.title).toEqual('Updated Title');
    expect(result.description).toEqual(testTodo.description);
    expect(result.completed).toEqual(testTodo.completed);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > testTodo.updated_at).toBe(true);
  });

  it('should update todo description', async () => {
    const testTodo = await createTestTodo();
    
    const updateInput: UpdateTodoInput = {
      id: testTodo.id,
      description: 'Updated description'
    };

    const result = await updateTodo(updateInput);

    expect(result.id).toEqual(testTodo.id);
    expect(result.title).toEqual(testTodo.title);
    expect(result.description).toEqual('Updated description');
    expect(result.completed).toEqual(testTodo.completed);
  });

  it('should update todo completion status', async () => {
    const testTodo = await createTestTodo();
    
    const updateInput: UpdateTodoInput = {
      id: testTodo.id,
      completed: true
    };

    const result = await updateTodo(updateInput);

    expect(result.id).toEqual(testTodo.id);
    expect(result.title).toEqual(testTodo.title);
    expect(result.description).toEqual(testTodo.description);
    expect(result.completed).toBe(true);
  });

  it('should update multiple fields', async () => {
    const testTodo = await createTestTodo();
    
    const updateInput: UpdateTodoInput = {
      id: testTodo.id,
      title: 'New Title',
      description: 'New description',
      completed: true
    };

    const result = await updateTodo(updateInput);

    expect(result.id).toEqual(testTodo.id);
    expect(result.title).toEqual('New Title');
    expect(result.description).toEqual('New description');
    expect(result.completed).toBe(true);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > testTodo.updated_at).toBe(true);
  });

  it('should update description to null', async () => {
    const testTodo = await createTestTodo();
    
    const updateInput: UpdateTodoInput = {
      id: testTodo.id,
      description: null
    };

    const result = await updateTodo(updateInput);

    expect(result.id).toEqual(testTodo.id);
    expect(result.title).toEqual(testTodo.title);
    expect(result.description).toBeNull();
    expect(result.completed).toEqual(testTodo.completed);
  });

  it('should save changes to database', async () => {
    const testTodo = await createTestTodo();
    
    const updateInput: UpdateTodoInput = {
      id: testTodo.id,
      title: 'Database Updated Title',
      completed: true
    };

    await updateTodo(updateInput);

    // Verify changes were saved to database
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, testTodo.id))
      .execute();

    expect(todos).toHaveLength(1);
    expect(todos[0].title).toEqual('Database Updated Title');
    expect(todos[0].completed).toBe(true);
    expect(todos[0].updated_at).toBeInstanceOf(Date);
    expect(todos[0].updated_at > testTodo.updated_at).toBe(true);
  });

  it('should throw error when todo does not exist', async () => {
    const updateInput: UpdateTodoInput = {
      id: 999999,
      title: 'Non-existent Todo'
    };

    await expect(updateTodo(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should always update the updated_at timestamp', async () => {
    const testTodo = await createTestTodo();
    
    // Wait a tiny bit to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 1));
    
    const updateInput: UpdateTodoInput = {
      id: testTodo.id,
      title: 'Timestamp Test'
    };

    const result = await updateTodo(updateInput);

    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(testTodo.updated_at.getTime());
  });
});
