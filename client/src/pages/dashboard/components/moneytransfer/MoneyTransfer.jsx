import React, { useState, forwardRef } from "react";
import { moneyTransfer } from "../../utils/axios";
import { useUserContext } from "../../../../common/contexts/UserProvider";
import { toast } from "sonner";

const MoneyTransfer = forwardRef(({ refreshUserData }, ref) => {
  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const user = useUserContext();

  const handleSubmit = async () => {
    if (!fromAccountId || !toAccountId || !amount) {
      toast.error("All fields are required");
      return;
    }

    const result = await moneyTransfer(user.token, fromAccountId, toAccountId, parseFloat(amount));
    if (result && result.accounts) {
      user.setAccounts(result.accounts);
      refreshUserData?.();
      setFromAccountId("");
      setToAccountId("");
      setAmount("");
    }
  };

  return (
    <div className="bg-transparent backdrop-blur-[2px] w-full absolute h-screen">
      <div className="flex flex-row justify-center items-center h-full">
        <div className="flex flex-col p-10 bg-white text-center rounded-lg min-w-80 shadow-2xl" ref={ref}>
          <span className="text-2xl mb-10 font-semibold">Money Transfer</span>
          <input
            className="text-center h-10 border mb-5 rounded-md outline-none"
            type="text"
            placeholder="From Account Id"
            value={fromAccountId}
            onChange={(e) => setFromAccountId(e.target.value)}
          />
          <input
            className="text-center h-10 border mb-5 rounded-md outline-none"
            type="text"
            placeholder="To Account Id"
            value={toAccountId}
            onChange={(e) => setToAccountId(e.target.value)}
          />
          <input
            className="text-center h-10 border mb-5 rounded-md outline-none"
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <button
            className="p-2 bg-[#dedfe6] rounded-sm hover:bg-[#cdced4] text-slate-800"
            onClick={handleSubmit}
          >
            Transfer
          </button>
        </div>
      </div>
    </div>
  );
});

export default MoneyTransfer;
