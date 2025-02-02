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

      console.log("New default income values:", newIncome);

      // Upsert income records for the current month
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

      const { error: upsertError } = await supabase.from("income").upsert(incomeEntries, {
        onConflict: ["user_id", "source", "date"],
      });

      if (upsertError) throw upsertError;

      // ✅ Force state update after inserting defaults
      setIncome((prev) => {
        console.log("Updating income state from:", prev, "to:", newIncome);
        return { ...newIncome };
      });

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
    console.error("Error loading defaults:", error);
    toast({
      title: "Error loading defaults",
      description: error.message || "An unknown error occurred",
      variant: "destructive",
    });
  }
};
