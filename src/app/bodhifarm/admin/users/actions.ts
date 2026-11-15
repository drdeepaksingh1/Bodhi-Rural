'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '../../../../lib/supabase/server';

type UpdateManagedUserInput = {
  userId: string;
  roleId: string;
  locationId: string | null;
  isActive: boolean;
};

type UpdateManagedUserResult =
  | { success: true }
  | { success: false; error: string };

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function updateManagedUserRole(
  input: UpdateManagedUserInput
): Promise<UpdateManagedUserResult> {
  if (
    !input ||
    !UUID_PATTERN.test(input.userId) ||
    !UUID_PATTERN.test(input.roleId) ||
    (input.locationId !== null && !UUID_PATTERN.test(input.locationId)) ||
    typeof input.isActive !== 'boolean'
  ) {
    return { success: false, error: 'Invalid user role assignment details.' };
  }

  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'Your session has expired. Please sign in again.' };
  }

  const { error } = await supabase.rpc('admin_update_user_role_assignment', {
    p_target_user_id: input.userId,
    p_role_id: input.roleId,
    p_location_id: input.locationId,
    p_is_active: input.isActive,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/bodhifarm/admin/users');
  return { success: true };
}
