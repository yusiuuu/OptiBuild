// Dashboard-specific layout that allows full-screen layout
// This layout removes the container constraints from the root layout
// to enable full viewport usage for the dashboard
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen w-full">
      {children}
    </div>
  )
}

