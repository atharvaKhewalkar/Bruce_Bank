import axios from "axios";
import { BACKEND_DOMAIN } from "../../../common/constants";
import { toast } from "sonner";

export const getUserData = async (token, setLoading, setAccounts, setUser) => {
  try {
    const response = await axios.get(BACKEND_DOMAIN + "/v1/account", {
      headers: { Authorization: `Bearer ${token}` }
    });
    setUser(response.data.user);
    setAccounts(response.data.accounts);
    setLoading(false);
  } catch (error) {
    console.error(error);
    toast.error("Failed to load user data");
  }
};

export const createAccount = async (token, balance) => {
  try {
    const response = await axios.post(BACKEND_DOMAIN + "/v1/account/create", {
      initial_balance: balance
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    toast.success("Account Added");
    window.location.reload();
  } catch (error) {
    console.error(error);
    toast.error("Failed to create account");
  }
};

export const deleteAccount = async (token, id) => {
  try {
    const response = await axios.delete(BACKEND_DOMAIN + `/v1/account/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    toast.success("Account Deleted");
    window.location.reload();
  } catch (error) {
    console.error(error);
    toast.error("Failed to delete account");
  }
};

export const moneyTransfer = async (token, fromAccountId, toAccountId, amount) => {
  try {
    const response = await axios.patch(BACKEND_DOMAIN + `/v1/account/update`, {
      fromAccountId,
      toAccountId,
      amount
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    toast.success("Transfer successful");
    return response.data;
  } catch (error) {
    console.error("Transfer error:", error);
    toast.error("Transfer failed");
    return null;
  }
};
