import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { db } from "@/lib/db"

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ instagram_connected?: string; subscription?: string; page?: string }>
}) {
  const session = await auth()
  const params = await searchParams

  if (!session?.user?.id) {
    redirect("/login")
  }

  const POSTS_PER_PAGE = 10
  const page = Math.max(1, parseInt(params.page || "1", 10))
  const skip = (page - 1) * POSTS_PER_PAGE

  const [user, postsCount] = await Promise.all([
    db.user.findUnique({
      where: { id: session.user.id },
      include: {
        metaAccount: true,
        posts: {
          orderBy: { createdAt: "desc" },
          take: POSTS_PER_PAGE,
          skip: skip,
        },
      },
    }),
    db.post.count({ where: { userId: session.user.id } }),
  ])

  const totalPages = Math.ceil(postsCount / POSTS_PER_PAGE)
  const instagramConnected = params.instagram_connected === "true" || !!user?.metaAccount

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-xl font-semibold">Dashboard</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {params.subscription === "success" && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
            <p className="text-green-400 font-medium">Subscription activated!</p>
          </div>
        )}

        {params.instagram_connected === "true" && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
            <p className="text-green-400 font-medium">Instagram account connected!</p>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Instagram Connection Card */}
          <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
            <div className="flex items-center gap-3 mb-4">
              <svg className="w-6 h-6 text-pink-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
              <h2 className="text-lg font-medium">Instagram</h2>
            </div>

            {instagramConnected ? (
              <div>
                <p className="text-white/60 text-sm mb-3">
                  Connected as {user?.metaAccount?.instagramUsername || "Instagram User"}
                </p>
                <p className="text-green-400 text-sm">Active</p>
              </div>
            ) : (
              <div>
                <p className="text-white/60 text-sm mb-3">
                  Connect your Instagram Business account to start posting
                </p>
                <a
                  href="/api/auth/meta"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Connect Instagram
                </a>
              </div>
            )}
          </div>

          {/* Subscription Card */}
          <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
            <h2 className="text-lg font-medium mb-4">Subscription</h2>
            <p className="text-2xl font-semibold mb-2">
              {user?.subscriptionTier === "pro" ? "Pro" : "Free"}
            </p>
            <p className="text-white/60 text-sm mb-4">
              {user?.stripeSubStatus || "No active subscription"}
            </p>

            {user?.subscriptionTier !== "pro" ? (
              <a
                href="/api/stripe/checkout"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-black text-sm font-medium rounded-lg hover:bg-white/90 transition-colors"
              >
                Upgrade to Pro
              </a>
            ) : (
              <a
                href="/api/stripe/portal"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Manage Subscription
              </a>
            )}
          </div>

          {/* Stats Card */}
          <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
            <h2 className="text-lg font-medium mb-4">Posts</h2>
            <p className="text-2xl font-semibold mb-2">
              {postsCount}
            </p>
            <p className="text-white/60 text-sm mb-4">Total posts created</p>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                {page > 1 ? (
                  <Link
                    href={`/dashboard?page=${page - 1}`}
                    className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Previous
                  </Link>
                ) : (
                  <span className="px-3 py-1 bg-white/5 text-white/40 text-sm font-medium rounded-lg cursor-not-allowed">
                    Previous
                  </span>
                )}
                <span className="text-white/60 text-sm">
                  Page {page} of {totalPages}
                </span>
                {page < totalPages ? (
                  <Link
                    href={`/dashboard?page=${page + 1}`}
                    className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Next
                  </Link>
                ) : (
                  <span className="px-3 py-1 bg-white/5 text-white/40 text-sm font-medium rounded-lg cursor-not-allowed">
                    Next
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}