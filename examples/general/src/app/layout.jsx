export default function Layout({ children }) {
  // throw new Error("This is a Layout error");
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
