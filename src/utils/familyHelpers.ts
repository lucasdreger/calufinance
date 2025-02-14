import { supabase } from "@/integrations/supabase/client";

export const createFamily = async (familyName: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Start a transaction
  const { data: family, error: familyError } = await supabase
    .from('families')
    .insert({ name: familyName })
    .select()
    .single();

  if (familyError) throw familyError;

  // Add current user as family member with ON CONFLICT handling
  const { error: memberError } = await supabase
    .from('family_members')
    .insert({
      family_id: family.id,
      user_id: user.id
    })
    .onConflict('user_id')
    .ignore();

  if (memberError) throw memberError;

  return family;
};

export const addFamilyMember = async (familyId: string, email: string) => {
  const { data: userToAdd, error: userError } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single();

  if (userError || !userToAdd) throw new Error('User not found');

  const { error: memberError } = await supabase
    .from('family_members')
    .insert({
      family_id: familyId,
      user_id: userToAdd.id
    })
    .onConflict('user_id')
    .ignore();

  if (memberError) throw memberError;
};