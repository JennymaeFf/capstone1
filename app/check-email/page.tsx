import Link from "next/link";

export default function CheckEmailPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#fff7e8] px-4 py-8 text-[#5b3924]">
      <section className="w-full max-w-md rounded-3xl border border-[#ead7b7] bg-[#fffaf1] p-7 text-center shadow-[0_18px_45px_rgba(91,57,36,0.18)] sm:p-9">
        <div className="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-3xl bg-[#2f6b3f] text-4xl text-[#fff7e8] shadow-lg">
          ✉
        </div>
        <h1 className="text-2xl font-extrabold leading-tight text-[#214d2e] sm:text-3xl">
          Verification code sent to your email
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#74513a]">Please check your inbox or spam folder</p>
        <Link
          href="/verify"
          className="mt-7 inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#e8862f] font-bold text-[#fffaf1] shadow-lg transition hover:bg-[#bd641f]"
        >
          Go to Verify Page
        </Link>
      </section>
    </main>
  );
}
