import { redirect } from "next/navigation";

import { getSession } from "@/lib/dal";

// El proxy ya redirige `/`; esto cubre el caso de que no se ejecute
export default async function Home() {
  redirect((await getSession()) ? "/dashboard" : "/auth");
}
