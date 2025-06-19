import Link from "next/link";

export default function LandingPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)",
        fontFamily: "sans-serif",
      }}
    >
      <h1 style={{ fontSize: "2.5rem", marginBottom: "1.5rem", color: "#3730a3" }}>
        Welcome! Login as:
      </h1>
      <nav style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <Link
          href="/login/admin"
          style={{
            padding: "0.75rem 2.5rem",
            background: "#6366f1",
            color: "#fff",
            borderRadius: "0.5rem",
            textDecoration: "none",
            fontWeight: "bold",
            fontSize: "1.1rem",
            textAlign: "center",
            transition: "background 0.2s",
          }}
        >
          Login as Admin
        </Link>
        <Link
          href="/login/doctor"
          style={{
            padding: "0.75rem 2.5rem",
            background: "#10b981",
            color: "#fff",
            borderRadius: "0.5rem",
            textDecoration: "none",
            fontWeight: "bold",
            fontSize: "1.1rem",
            textAlign: "center",
            transition: "background 0.2s",
          }}
        >
          Login as Doctor
        </Link>
        <Link
          href="/login/reception"
          style={{
            padding: "0.75rem 2.5rem",
            background: "#f59e42",
            color: "#fff",
            borderRadius: "0.5rem",
            textDecoration: "none",
            fontWeight: "bold",
            fontSize: "1.1rem",
            textAlign: "center",
            transition: "background 0.2s",
          }}
        >
          Login as Receptionist
        </Link>
      </nav>
    </main>
  );
}