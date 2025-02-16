import { Suspense } from "react";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="bg-[#313442]">
      <Suspense>
        <div className="flex items-center justify-center min-h-screen">
          <div
            className=" bg-[#1F2128]
 border border-[#313442]
 shadow-lg p-10 rounded-2xl w-[512px]"
          >
            {children}
          </div>
        </div>
      </Suspense>
    </main>
  );
}
