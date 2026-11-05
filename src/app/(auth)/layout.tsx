interface Props {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: Props) {
  return <div className="flex min-h-svh flex-1 flex-col">{children}</div>;
}
