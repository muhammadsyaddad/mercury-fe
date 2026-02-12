import Image from "next/image";
import Link from "next/link";
import appIcon from "public/appicon.png";

export default function NotFound() {
  return (
    <div className="h-screen flex flex-col items-center justify-center text-center">
      <div className="bg-gradient-to-br from-blue-50/60 to-indigo-50/30 dark:from-blue-950/20 dark:to-indigo-950/10 rounded-2xl p-10 flex flex-col items-center border border-blue-200/40 dark:border-blue-800/30">
        <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center ring-1 ring-blue-200 dark:ring-blue-800 mb-6">
          <Image
            src={appIcon}
            width={48}
            height={48}
            alt="Midday"
            quality={100}
          />
        </div>
        <h2 className="text-xl font-semibold mb-2 text-blue-900 dark:text-blue-100">Not Found</h2>
        <p className="mb-6 text-sm text-blue-700/60 dark:text-blue-300/60">Could not find requested resource</p>
        <Link href="/" className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline underline-offset-4 transition-colors">
          Return Home
        </Link>
      </div>
    </div>
  );
}
