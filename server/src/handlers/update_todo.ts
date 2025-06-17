
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type UpdateTodoInput, type Todo } from '../schema';
import { eq } from 'drizzle-orm';

export const updateTodo = async (input: UpdateTodoInput): Promise<Todo> => {
  try {
    // Check if todo exists first
    const existing = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, input.id))
      .execute();

    if (existing.length === 0) {
      throw new Error(`Todo with id ${input.id} not found`);
    }

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date() // Always update timestamp
    };

    if (input.title !== undefined) {
      updateData.title = input.title;
    }

    if (input.description !== undefined) {
      updateData.description = input.description;
    }

    if (input.completed !== undefined) {
      updateData.completed = input.completed;
    }

    // Update the todo
    const result = await db.update(todosTable)
      .set(updateData)
      .where(eq(todosTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Todo update failed:', error);
    throw error;
  }
};
