import Link from "next/link";

export default function NotFound() {
    return (
        <div className="flex flex-col h-screen justify-center items-center gap-2">
            <h1 className="text-2xl">404</h1>
            <p className="text-lg">Page not found</p>
            <Link href="/" className="hover:underline">
                Go to Homepage
            </Link>
        </div>
    );
}
