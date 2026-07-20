import { Suspense } from "react";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
