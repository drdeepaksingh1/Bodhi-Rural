      farmerResult.error ||
      batchResult.error ||
      procurementResult.error ||
      expenseResult.error ||
      paymentResult.error;

    if (firstError) {
      setError(firstError.message);
    } else {
      setFarmers(farmerResult.data || []);
      setBatches(batchResult.data || []);
      setProcurements(procurementResult.data || []);
      setExpenses(expenseResult.data || []);
      setPayments(paymentResult.data || []);
    }

    setLoading(false);
  }

  async function currentUserId() {
    const { data } = await supabase.auth.getUser();
    return data.user?.id || null;
  }

  async function saveProcurement() {
    setMessage('');
    setError('');

    const eggs = Number(saleableEggs);
    const rate = Number(ratePerEgg);
    const quality = Number(qualityDeduction || 0);
    const other = Number(otherDeduction || 0);

    if (!procurementFarmer || !eggs || eggs < 1 || rate < 0) {
      setError('Select a farmer and enter valid saleable eggs and rate.');
      return;
    }

    if (procurementNet < 0) {
      setError('Deductions cannot exceed the gross procurement amount.');
      return;
    }

    setSaving(true);

    const userId = await currentUserId();

    const { error: insertError } = await supabase
      .from('egg_procurement')
      .insert({
        farmer_id: procurementFarmer,
        batch_id: procurementBatch || null,
        collection_date: collectionDate,
        saleable_eggs: eggs,
        rate_per_egg: rate,
        quality_deduction: quality,
        other_deduction: other,
        remarks: procurementRemarks || null,
        status: 'PENDING',
        created_by: userId,
      });

    if (insertError) {
      setError(insertError.message);
    } else {
      setMessage('Egg procurement saved as PENDING.');
      setSaleableEggs('');
      setQualityDeduction('0');
      setOtherDeduction('0');
      setProcurementRemarks('');
      await loadData();
    }

    setSaving(false);
  }

  async function approveProcurement(id: string) {
    setMessage('');
    setError('');
    const userId = await currentUserId();

    const { error: updateError } = await supabase
      .from('egg_procurement')
      .update({
        status: 'APPROVED',
        approved_by: userId,
        approved_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('status', 'PENDING');

    if (updateError) setError(updateError.message);
    else {
      setMessage('Procurement approved and posted to farmer ledger.');
      await loadData();
    }
  }

  async function saveExpense() {
    setMessage('');
    setError('');

    const amount = Number(expenseAmount);

    if (!expenseFarmer || !amount || amount <= 0) {
      setError('Select a farmer and enter a valid expense amount.');
      return;
    }

    setSaving(true);
    const userId = await currentUserId();

    const { error: insertError } = await supabase
      .from('farmer_expenses')
      .insert({
        farmer_id: expenseFarmer,
        batch_id: expenseBatch || null,
        expense_date: expenseDate,
        expense_type: expenseType,
        description: expenseDescription || null,
        amount,
        status: 'APPROVED',
        created_by: userId,
        approved_by: userId,
        approved_at: new Date().toISOString(),
      });

    if (insertError) setError(insertError.message);
    else {
      setMessage('Farmer expense saved and posted to ledger.');
      setExpenseAmount('');
      setExpenseDescription('');
      await loadData();
    }

    setSaving(false);
  }

  async function savePayment() {
    setMessage('');
    setError('');

    const amount = Number(paymentAmount);

    if (!paymentFarmer || !amount || amount <= 0) {
      setError('Select a farmer and enter a valid payment amount.');
      return;
    }

    if ((paymentMode === 'BANK' || paymentMode === 'UPI') && !paymentReference) {
      setError('Enter the bank/UPI reference number.');
      return;
    }

    setSaving(true);
    const userId = await currentUserId();

    const { error: insertError } = await supabase
      .from('farmer_payments')
      .insert({
