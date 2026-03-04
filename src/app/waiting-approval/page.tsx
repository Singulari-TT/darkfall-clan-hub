import Link from "next/link";

export default function WaitingApproval() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
            <div className="p-10 bg-gray-800 rounded-xl shadow-2xl space-y-6 text-center border border-yellow-700 max-w-lg w-full">
                <div className="flex justify-center mb-4">
                    <svg className="w-16 h-16 text-yellow-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                    </svg>
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight text-white mt-4">
                    Account Pending Approval
                </h1>
                <p className="text-gray-400 text-lg">
                    Your Discord account has been linked, but your access is currently <span className="text-yellow-400 font-semibold">Pending</span>.
                </p>
                <p className="text-gray-500 text-sm">
                    Please contact a Clan Administrator in Discord to verify your identity and activate your account.
                </p>
                <div className="pt-6">
                    <Link href="/api/auth/signout" className="text-indigo-400 hover:text-indigo-300 underline font-medium transition-colors">
                        Sign out
                    </Link>
                </div>
            </div>
        </div>
    );
}
