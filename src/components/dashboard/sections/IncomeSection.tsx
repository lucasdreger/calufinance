const handleLoadDefaults = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to load defaults",
        variant: "destructive",
      });
      return;
    }

    // Fetch default income values
    const { data, error } = await supabase
      .from("income")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_default", true);

    if (error) throw error;

    if (data && data.length > 0) {
      const currentDate = new Date().toISOString().split("T")[0];

      const newIncome = {
        lucas: data.find((inc) => inc.source === "Primary Job")?.amount || 0,
        camila: data.find((inc) => inc.source === "Wife Job 1")?.amount || 0,
        other: data.find((inc) => inc.source === "Other")?.amount || 0,
      };

      console.log("🚀 New default income values:", newIncome);

      // Delete existing income records for the current month
      const { error: deleteError } = await supabase
        .from("income")
        .delete()
        .eq("user_id", user.id)
        .eq("date", currentDate)
        .eq("is_default", false);

      if (deleteError) throw deleteError;

      // Insert new income records for the current month
      const incomeEntries = [
        { amount: newIncome.lucas, source: "Primary Job" },
        { amount: newIncome.camila, source: "Wife Job 1" },
        { amount: newIncome.other, source: "Other" },
      ].map((entry) => ({
        ...entry,
        date: currentDate,
        user_id: user.id,
        is_default: false,
      }));

      const { error: insertError } = await supabase
        .from("income")
        .insert(incomeEntries);

      if (insertError) throw insertError;

      // ✅ Fix: Fetch updated values from Supabase after inserting
      const { data: updatedData, error: fetchError } = await supabase
        .from("income")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", currentDate)
        .eq("is_default", false);

      if (fetchError) throw fetchError;

      console.log("✅ Confirmed from DB:", updatedData);

      setIncome((prev) => ({
        ...prev,
        lucas: updatedData.find((inc) => inc.source === "Primary Job")?.amount || 0,
        camila: updatedData.find((inc) => inc.source === "Wife Job 1")?.amount || 0,
        other: updatedData.find((inc) => inc.source === "Other")?.amount || 0,
      }));

      console.log("🎯 Updated income state:", income);

      toast({
        title: "Income Defaults Loaded",
        description: "Your default monthly income has been loaded successfully.",
      });
    } else {
      toast({
        title: "No defaults found",
        description: "Please set up default values in the Administration page first.",
      });
    }
  } catch (error: any) {
    console.error("❌ Error loading defaults:", error);
    toast({
      title: "Error loading defaults",
      description: error.message || "An unknown error occurred",
      variant: "destructive",
    });
  }
};
