const updateTasks = async () => {
  const currentDate = new Date();
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString();

  // Obter categoria "Credit Card"
  const { data: category } = await supabase
    .from('expenses_categories')
    .select('id')
    .eq('name', 'Credit Card')
    .maybeSingle();

  if (!category) {
    console.error('Credit Card category not found');
    return;
  }

  // Buscar todas as despesas do cartão de crédito no mês atual e somar os valores
  const { data: creditCardExpenses } = await supabase
    .from('expenses')
    .select('amount')
    .eq('category_id', category.id)
    .gte('date', startOfMonth)
    .lte('date', endOfMonth);

  const creditCardTotal = creditCardExpenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0;

  // Buscar todas as rendas de Lucas no mês atual e somar os valores
  const { data: lucasIncome } = await supabase
    .from('income')
    .select('amount')
    .eq('source', 'Primary Job')
    .gte('date', startOfMonth)
    .lte('date', endOfMonth);

  const lucasTotal = lucasIncome?.reduce((sum, income) => sum + income.amount, 0) || 0;

  // Calcular a quantia restante após pagar o cartão de crédito
  const remainingAmount = lucasTotal - creditCardTotal;

  // Calcular o valor da transferência para garantir que pelo menos 1000 fiquem disponíveis
  const transferAmount = remainingAmount < 1000 ? 1000 - remainingAmount : 0;

<<<<<<< HEAD
  console.log('Debug values:', {
    lucasTotal,
    creditCardTotal,
    remainingAmount,
    shouldShowTransfer: remainingAmount < 1000,
    transferAmount,
    date: currentDate.toISOString(),
    startOfMonth,
    endOfMonth
  });
=======
    const creditCardTotal = creditCardExpenses?.amount || 0;
    const lucasTotal = lucasIncome?.amount || 0;
    const remainingAmount = lucasTotal - creditCardTotal;
    const transferAmount = remainingAmount < 1000 ? (1000 - remainingAmount) : 0;
>>>>>>> 370c4b460f8dd87ab27d0920b368aa7cf80da2c4

  if (creditCardTotal === 0) {
    toast({
      title: "Credit Card Bill Not Set",
      description: "Please update the Credit Card bill amount for this month.",
      variant: "default",
      className: "bg-yellow-50 border-yellow-200 text-yellow-800",
    });

    setTasks(currentTasks => currentTasks.filter(task => task.id !== 'credit-card-transfer'));
  } else if (remainingAmount < 1000) {
    const newTask = {
      id: 'credit-card-transfer',
      name: `Transfer ${formatCurrency(transferAmount)} to Credit Card bill`,
      completed: false,
    };

    setTasks(currentTasks => {
      const existingTaskIndex = currentTasks.findIndex(task => task.id === 'credit-card-transfer');
      if (existingTaskIndex >= 0) {
        const updatedTasks = [...currentTasks];
        updatedTasks[existingTaskIndex] = newTask;
        return updatedTasks;
      }
      return [...currentTasks, newTask];
    });

    toast({
      title: "Credit Card Transfer Required",
      description: `Need to transfer ${formatCurrency(transferAmount)} for this month's Credit Card bill`,
      variant: "default",
      className: "bg-yellow-50 border-yellow-200 text-yellow-800",
    });
  } else {
    setTasks(currentTasks => currentTasks.filter(task => task.id !== 'credit-card-transfer'));
  }
};