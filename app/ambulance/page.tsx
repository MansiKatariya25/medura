import { redirect } from "next/navigation";

export default function AmbulanceRedirect() {
  redirect("/auth/ambulance");
}
