import { Suspense } from "react";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="bg-Neutral/Neutral-Border-[night]">
      <Suspense>
        <div className="flex items-center justify-center min-h-screen">
          <div
            className=" bg-Neutral-BG-[night]
 border border-Neutral/Neutral-Border-[night]
 shadow-lg p-10 rounded-2xl w-[512px]"
          >
            {children}
          </div>
        </div>
      </Suspense>
    </main>
  );
}
