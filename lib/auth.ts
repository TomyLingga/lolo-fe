import Cookies from "js-cookie";
import { User } from "@/types";

export const getToken = () => Cookies.get("token");

export const getUser = (): User | null => {
  try {
    const u = Cookies.get("user");
    return u ? JSON.parse(u) : null;
  } catch { return null; }
};

export const setAuth = (token: string, user: User) => {
  Cookies.set("token", token, { expires: 7 });
  Cookies.set("user", JSON.stringify(user), { expires: 7 });
};

export const clearAuth = () => {
  Cookies.remove("token");
  Cookies.remove("user");
};

export const isAdmin = (): boolean => getUser()?.role === "admin";
