import { redirect } from "next/navigation";
import { appConfig } from "@/config/dolab.config";

// "/" has no content of its own. proxy.ts already sends logged-out visitors
// to /login, so anyone who reaches this point is logged in.
export default function HomePage() {
  redirect(appConfig.homePath);
}
